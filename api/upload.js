import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;

    const fileBuffer = Buffer.from(fileBase64, 'base64');

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType,
    });

    // Ensure queryPrompt is a string with your GraphQL query
    const graphqlQuery = queryPrompt || '{ job_posting { job_title } }';

    formData.append('body', JSON.stringify({
      query: graphqlQuery,
      params: { mode: 'fast' }
    }));

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AgentQL error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
