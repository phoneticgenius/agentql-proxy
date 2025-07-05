// /api/upload.js  (Vercel Serverless Function – CommonJS style)
const FormData  = require('form-data');
const { Readable } = require('stream');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { fileBase64, fileName = 'document.pdf', contentType = 'application/pdf', queryPrompt } = req.body;

    if (!fileBase64)   return res.status(400).json({ error: 'Missing fileBase64' });

    // 1. Decode Base64 → Buffer → Stream
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const fileStream = Readable.from(fileBuffer);            // stream is safer for form-data

    // 2. Build FormData exactly like AgentQL docs
    const formData = new FormData();
    formData.append('file', fileStream, {
      filename: fileName,
      contentType,
      knownLength: fileBuffer.length
    });

    // body: **only** the query
    const sanitizedQuery = (queryPrompt || '{ job_posting { job_title } }').replace(/\s+/g, ' ').trim();
    formData.append('body', JSON.stringify({ query: sanitizedQuery }));

    // params: its own part
    formData.append('params', JSON.stringify({ mode: 'fast' }));

    // 3. Send
    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,   // keep this secret in Vercel env vars
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) return res.status(response.status).json(data);
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
};
