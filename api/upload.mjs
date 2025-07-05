import fs from 'fs';
import FormData from 'form-data';

async function main() {
  const fetch = (await import('node-fetch')).default;

  // Make sure this path points to your actual file
  const filePath = './my-file.pdf';
  const file = fs.readFileSync(filePath);

  const form_data = new FormData();
  form_data.append('file', file, {
    filename: 'my-file.pdf',
    contentType: 'application/pdf',
  });

  form_data.append('body', JSON.stringify({ query: ' { query { job_title } } ' }));
  form_data.append('params', JSON.stringify({ mode: 'fast' }));

  const response = await fetch('https://api.agentql.com/v1/query-document', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.AGENTQL_API_KEY,
      ...form_data.getHeaders(),
    },
    body: form_data,
  });

  const data = await response.json();
  console.log(data);
}

main().catch(console.error);
