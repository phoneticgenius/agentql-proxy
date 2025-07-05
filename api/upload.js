import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { fileBase64, fileName, contentType } = req.body;
    console.log('Received fileName:', fileName);
    console.log('Received contentType:', contentType);

    const fileBuffer = Buffer.from(fileBase64, 'base64');
    console.log('file size (bytes):', fileBuffer.length);

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: contentType,
    });

    const graphqlQuery = `
      query {
        job_posting {
          job_title
        }
      }
    `;

    formData.append('body', JSON.stringify({
      query: graphqlQuery,
      params: { mode: 'fast' }
    }));

    console.log('Sending multipart/form-data to AgentQL...');

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await response.json();
    console.log('AgentQL response:', data);
    res.status(response.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
