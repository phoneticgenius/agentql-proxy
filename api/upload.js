const fs = require('fs');
const fetch = require('node-fetch');

async function uploadFileManualMultipart(filePath, fileName, queryPrompt, apiKey) {
  const boundary = '------------------------abcdef1234567890';
  const CRLF = '\r\n';

  // Read file as Buffer
  const fileBuffer = fs.readFileSync(filePath);

  // Compose JSON part with query and params combined
  const jsonBody = JSON.stringify({
    query: queryPrompt,
    params: { mode: 'fast' }
  });

  // Build multipart body parts as buffers
  const parts = [];

  // --boundary + file part header
  parts.push(Buffer.from(`--${boundary}${CRLF}`));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`));
  parts.push(Buffer.from(`Content-Type: application/octet-stream${CRLF}${CRLF}`));
  parts.push(fileBuffer);  // raw file data
  parts.push(Buffer.from(CRLF)); // CRLF after file data

  // --boundary + body (json) part header
  parts.push(Buffer.from(`--${boundary}${CRLF}`));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="body"${CRLF}`));
  parts.push(Buffer.from(`Content-Type: application/json${CRLF}${CRLF}`));
  parts.push(Buffer.from(jsonBody));
  parts.push(Buffer.from(CRLF));

  // --boundary-- end
  parts.push(Buffer.from(`--${boundary}--${CRLF}`));

  // Concatenate all parts into a single Buffer
  const multipartBody = Buffer.concat(parts);

  // Send request with manual multipart/form-data body
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

// Example usage:
(async () => {
  try {
    const filePath = './job_offer.pdf';
    const fileName = 'job_offer.pdf';
    const queryPrompt = '{ job_posting { job_title } }';
    const apiKey = process.env.AGENTQL_API_KEY;

    const result = await uploadFileManualMultipart(filePath, fileName, queryPrompt, apiKey);
    console.log('Response:', result);
  } catch (err) {
    console.error('Error:', err);
  }
})();
