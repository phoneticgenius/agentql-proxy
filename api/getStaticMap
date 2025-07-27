// /api/static-map.js

export default async function handler(req, res) {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const encodedAddress = encodeURIComponent(address);
  const googleMapURL = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x300&markers=color:red%7C${encodedAddress}&key=${apiKey}`;

  try {
    const response = await fetch(googleMapURL);
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch map image." });
  }
}
