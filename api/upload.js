const FormData = require('form-data');
const { Readable } = require('stream');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    if (!req.body || typeof req.body === 'string') {
      req.body = JSON.parse(req.body); // if body is raw string
    }

    const {
      fileBase64,
      fileName = 'document.pdf',
      contentType = 'application/pdf',
      queryPrompt = '{ job_posting { job_title } }'
    } = req.body;

    if (!fileBase64) return res.status(400).json({ error: 'Missing fileBase64' });

    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const fileStream = Readable.from(fileBuffer);

    const formData = new FormData();
    formData.append('file', fileStream, {
      filename: fileName,
      contentType,
      knownLength: fileBuffer.length
    });

    // Clean query
    const query = queryPrompt.replace(/\s+/g, ' ').trim();
    formData.append('body', JSON.stringify({ query }));
    formData.append('params', JSON.stringify({ mode: 'fast' }));

    const response = await fetch('https://api.agentql.com/v1/query-document', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.AGENTQL_API_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('AgentQL returned error:', response.status, data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
};
