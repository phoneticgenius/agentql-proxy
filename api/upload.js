import fs from 'fs';
import fetch from 'node-fetch'; // If using Node.js <18, else native fetch is available
import FormData from 'form-data';

async function main() {
  const file = fs.readFileSync('@path/to/file.pdf'); // Replace with actual file path
  const form_data = new FormData();

  form_data.append('file', file, {
    filename: 'file.pdf',
    contentType: 'application/pdf'
  });

  form_data.append('body', JSON.stringify({ query: ' { query { job_title } } ' }));
  form_data.append('params', JSON.stringify({ mode: 'fast' }));

  const response = await fetch('https://api.agentql.com/v1/query-document', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.AGENTQL_API_KEY, // use your API key here
      ...form_data.getHeaders(),  // important for FormData in Node.js
    },
    body: form_data
  });

  const data = await response.json();
  console.log(data);
}

main().catch(console.error);
