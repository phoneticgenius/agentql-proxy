import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;
    console.log('Received fileName:', fileName);
    console.log('Received contentType:', contentType);
    console.log('Received queryPrompt:', queryPrompt);

    const fileBuffer = Buffer.from(fileBase64, 'base64');
    console.log('file size (bytes):', fileBuffer.length);

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: contentType,
    });

    // The API expects a JSON field named 'query' and optionally 'params'
    formData.append('query', queryPrompt);
    formData.append('params', JSON.stringify({ mode: 'fast' }));

    console.log('Sending multipart/form-data to AgentQL...');

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...formData.getHeaders(),  // very important to include form-data headers here
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
