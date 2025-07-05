const fs = require('fs');
const path = require('path');
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
    // Make sure method is POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Assuming the file is sent as base64 string in the JSON body under 'fileBase64'
    // and fileName, queryPrompt, apiKey are provided in the JSON request body

    const { fileBase64, fileName, queryPrompt, apiKey } = req.body;

    if (!fileBase64 || !fileName || !queryPrompt || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: fileBase64, fileName, queryPrompt, apiKey' });
    }

    // Convert base64 string to Buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // Call the upload function
    const result = await uploadFileManualMultipart(fileBuffer, fileName, queryPrompt, apiKey);

    // Return success response
    return res.status(200).json(result);

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
