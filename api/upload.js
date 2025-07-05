import fs from 'fs';
import path from 'path';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function uploadFileManualMultipart(fileBuffer, fileName, queryPrompt, apiKey) {
  const boundary = '------------------------abcdef1234567890';
  const CRLF = '\r\n';

  const jsonBody = JSON.stringify({
    query: queryPrompt,
    params: { mode: 'fast' }
  });

  const parts = [];

  parts.push(Buffer.from(`--${boundary}${CRLF}`));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`));
  parts.push(Buffer.from(`Content-Type: application/octet-stream${CRLF}${CRLF}`));
  parts.push(fileBuffer);
  parts.push(Buffer.from(CRLF));

  parts.push(Buffer.from(`--${boundary}${CRLF}`));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="body"${CRLF}`));
  parts.push(Buffer.from(`Content-Type: application/json${CRLF}${CRLF}`));
  parts.push(Buffer.from(jsonBody));
  parts.push(Buffer.from(CRLF));

  parts.push(Buffer.from(`--${boundary}--${CRLF}`));

  const multipartBody = Buffer.concat(parts);

  const response = await fetch('https://api.agentql.com/v1/query-document', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-API-Key': apiKey,
      'Content-Length': multipartBody.length.toString(),
    },
    body: multipartBody
  });

  const data = await response.json();
  return data;
}

export default async function handler(req, res) {
  try {
    console.log('Request body:', req.body);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { fileBase64, fileName, queryPrompt, apiKey } = req.body;

    if (!fileBase64 || !fileName || !queryPrompt || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const result = await uploadFileManualMultipart(fileBuffer, fileName, queryPrompt, apiKey);

    res.status(200).json(result);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
