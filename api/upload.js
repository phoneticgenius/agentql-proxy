// File: api/upload.js

import FormData from 'form-data';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const form = new FormData();
    form.append('file', fileBuffer, { filename: fileName, contentType });
    form.append(
      'body',
      JSON.stringify({ params: { mode: 'fast' }, query: queryPrompt })
    );

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
