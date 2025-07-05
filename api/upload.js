import { Buffer } from 'buffer';
import FormData from 'form-data';

export default async function handler(req, res) {
  console.log('Received request with method:', req.method);

  if (req.method !== 'POST') {
    console.log('Rejected request: method not allowed');
    return res.status(405).json({ error: 'Only POST is allowed' });
  }

  try {
    console.log('Parsing request body...');
    const body = await streamToJSON(req);
    console.log('Parsed body:', Object.keys(body));
    const { fileBase64, fileName, contentType, queryPrompt } = body;

    if (!fileBase64 || !fileName || !queryPrompt) {
      console.warn('Missing one or more required fields:', { fileBase64: !!fileBase64, fileName, queryPrompt });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Converting base64 file data to buffer...');
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    console.log('Buffer length:', fileBuffer.length);

    console.log('Creating FormData...');
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: contentType || 'application/pdf',
    });
    console.log('Appended file to form');

    console.log('Base64 length:', base64Pdf.length);
    console.log('Base64 start:', base64Pdf.slice(0, 100));
    console.log('Base64 end:', base64Pdf.slice(-100));

    const queryBody = { query: queryPrompt };
    console.log('Appending body field:', queryBody);
    form.append('body', JSON.stringify(queryBody));

    const params = { mode: 'fast' };
    console.log('Appending params field:', params);
    form.append('params', JSON.stringify(params));

    console.log('Importing fetch...');
    const fetch = (await import('node-fetch')).default;

    console.log('Sending request to AgentQL API...');
    const agentqlResp = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    console.log('AgentQL response status:', agentqlResp.status);

    const agentqlData = await agentqlResp.json();
    console.log('AgentQL response JSON:', JSON.stringify(agentqlData, null, 2));

    res.status(agentqlResp.status).json(agentqlData);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper to convert request stream into a JSON object
async function streamToJSON(req) {
  console.log('Reading request stream...');
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyString = Buffer.concat(chunks).toString('utf-8');
  console.log('Request body string:', bodyString.slice(0, 500)); // Log first 500 chars only
  return JSON.parse(bodyString);
}
