import { Buffer } from 'buffer';
import FormData from 'form-data';


export default async function handler(req, res) {
  // ✅ Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or use your domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ❌ Block all non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed' });
  }

  try {
    // Your existing logic
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;

    if (!fileBase64 || !fileName || !queryPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { Buffer } = await import('buffer');
    const FormData = (await import('form-data')).default;
    const fetch = (await import('node-fetch')).default;

    const buffer = Buffer.from(fileBase64, 'base64');
    const form = new FormData();

    form.append('file', buffer, {
      filename: fileName,
      contentType: contentType || 'application/pdf'
    });

    form.append('body', JSON.stringify({ query: queryPrompt }));
    form.append('params', JSON.stringify({ mode: 'fast' }));

    const agentqlResp = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await agentqlResp.json();
    res.status(agentqlResp.status).json(data);
  } catch (err) {
    console.error("AgentQL Proxy Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

