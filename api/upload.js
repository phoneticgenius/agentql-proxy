import CloudConvert from 'cloudconvert';
import { Buffer } from 'buffer';
import FormData from 'form-data';

const fetch = (await import('node-fetch')).default;

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed' });
  }

  try {
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;

    if (!fileBase64 || !fileName || !queryPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let fileBuffer = Buffer.from(fileBase64, 'base64');
    let finalFileName = fileName;
    let finalContentType = contentType;

    // 🔄 Convert Word to PDF using CloudConvert if needed
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.log("🌀 Converting DOCX to PDF...");

      const job = await cloudConvert.jobs.create({
        tasks: {
          upload: {
            operation: 'import/base64',
            file: fileBase64,
            filename: fileName
          },
          convert: {
            operation: 'convert',
            input: 'upload',
            output_format: 'pdf'
          },
          export: {
            operation: 'export/url',
            input: 'convert'
          }
        }
      });

      const exportTask = job.tasks.find(t => t.name === 'export');
      const downloadUrl = exportTask.result.files[0].url;

      const pdfResp = await fetch(downloadUrl);
      fileBuffer = await pdfResp.buffer();
      finalFileName = fileName.replace(/\.(docx|doc)$/i, '.pdf');
      finalContentType = 'application/pdf';

      console.log("✅ Converted to PDF:", finalFileName);
    }

    // 📤 Send to AgentQL
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: finalFileName,
      contentType: finalContentType || 'application/pdf'
    });
    form.append('body', JSON.stringify({ query: queryPrompt }));
    form.append('params', JSON.stringify({ mode: 'fast' }));

    const agentqlResp = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...form.getHeaders()
      },
      body: form,
    });

    const agentqlData = await agentqlResp.json();
    res.status(agentqlResp.status).json(agentqlData);

  } catch (err) {
    console.error("❌ AgentQL Proxy Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
