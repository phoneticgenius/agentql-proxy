const FormData = require('form-data');

export default async function handler(req, res) {
  console.log('Handler invoked');

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileBase64, fileName, contentType, queryPrompt } = req.body;
    console.log('Received payload keys:', Object.keys(req.body));
    console.log('fileName:', fileName);
    console.log('contentType:', contentType);
    console.log('queryPrompt:', queryPrompt);

    if (!fileBase64 || !fileName || !contentType) {
      console.error('Missing required parameters in request body');
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const fileBuffer = Buffer.from(fileBase64, 'base64');
    console.log('Decoded file buffer length:', fileBuffer.length);

    const formData = new FormData();

    console.log('Appending file to formData');
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType,
    });

   const graphqlQuery = queryPrompt && typeof queryPrompt === 'string'
  ? queryPrompt
  : `query {
    job_posting {
      job_title
    }
  }`;


    console.log('GraphQL query to send:', graphqlQuery);

    const bodyPayload = {
      query: graphqlQuery,
      params: { mode: 'fast' },
    };

    console.log('Appending body JSON string to formData:', JSON.stringify(bodyPayload));
    formData.append('body', JSON.stringify(bodyPayload));

    console.log('FormData headers:', formData.getHeaders());

    console.log('Sending multipart/form-data POST to AgentQL');

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log('AgentQL response status:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('AgentQL JSON response:', JSON.stringify(data, null, 2));
    } catch (jsonErr) {
      const text = await response.text();
      console.error('Failed to parse JSON from AgentQL response:', text);
      return res.status(response.status).send(text);
    }

    if (!response.ok) {
      console.error('AgentQL returned error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Successfully received data from AgentQL');
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy handler caught error:', err);
    return res.status(500).json({ error: err.message });
  }
}
