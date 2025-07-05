// /api/upload.mjs

import { Buffer } from 'buffer';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed' });
  }

  try {
    const body = await streamToJSON(req);
    const { fileBase64, fileName, contentType, queryPrompt } = body;

    if (!fileBase64 || !fileName || !queryPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: contentType || 'application/pdf',
    });

    form.append('body', JSON.stringify({ query: queryPrompt }));
    form.append('params', JSON.stringify({ mode: 'fast' }));

    const fetch = (await import('node-fetch')).default;

    const agentqlResp = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    const agentqlData = await agentqlResp.json();
    res.status(agentqlResp.status).json(agentqlData);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper to convert request stream into a JSON object
async function streamToJSON(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}
