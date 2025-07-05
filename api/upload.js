export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;
     console.log('Received fileName:', fileName);
    console.log('Received contentType:', contentType);
    console.log('file size (bytes):', fileBuffer.length);
    console.log('Received queryPrompt:', queryPrompt);
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: contentType }), fileName);
    formData.append('body', JSON.stringify({ params: { mode: 'fast' }, query: queryPrompt }));

    console.log('Sending multipart/form-data to AgentQL...');

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY
      },
      body: formData
    });

    const data = await response.json();
    console.log('AgentQL response:', data);
    res.status(response.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
