// api/map.js
export default function handler(request, response) {
  const { address } = request.query;

  if (!address) {
    return response.status(400).json({ error: 'Address parameter is required.' });
  }

  // IMPORTANT: Replace process.env.Maps_API_KEY with your actual Vercel Environment Variable name
  // This environment variable should be set in your Vercel project settings.
  const googleMapsApiKey = process.env.Maps_API_KEY;

  if (!googleMapsApiKey || googleMapsApiKey === "YOUR API KEY HERE") {
    // If the API key is not set, return a placeholder or an error.
    // For production, you might want to return an error or a generic message.
    // For development/preview, a placeholder makes sense.
    const placeholderSrc = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(address)}&key=YOUR_API_KEY_IS_MISSING`;
    return response.status(200).json({ mapUrl: placeholderSrc });
  }

  // Construct the Google Maps Embed API URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address)}`;

  // Send the URL back to the frontend
  response.status(200).json({ mapUrl });
}
