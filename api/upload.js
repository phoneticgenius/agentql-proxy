// /api/upload.mjs

import { Buffer } from 'buffer';
import FormData from 'form-data';
import mime from 'mime-types';

export const config = {
  runtime: 'edge', // Optional for Vercel
};

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
      contentType: contentType || mime.lookup(fileName) || 'application/pdf',
    });

    form.append('body', JSON.stringify({ query: queryPrompt }));
    form.append('params', JSON.stringify({ mode: 'fast' }));

    const fetch = (await import('node-fetch')).default;

    const agentqlResponse = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    const agentqlData = await agentqlResponse.json();

    if (!agentqlResponse.ok) {
      return res.status(agentqlResponse.status).json(agentqlData);
    }

    return res.status(200).json(agentqlData);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Utility to read stream body as JSON
async function streamToJSON(req) {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const bodyStr = Buffer.concat(buffers).toString('utf-8');
  return JSON.parse(bodyStr);
}
