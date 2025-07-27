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
    console.log("Google Maps response status:", response.status);

    if (!response.ok) {
      // Google API returned an error status
      const errorText = await response.text();
      console.error("Google Maps API error response:", errorText);
      return res.status(500).json({ error: "Failed to fetch map image from Google Maps API." });
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      // Response is not an image, maybe an error JSON or HTML page
      const errorBody = await response.text();
      console.error("Unexpected content type or body from Google Maps:", contentType, errorBody);
      return res.status(500).json({ error: "Google Maps API did not return an image." });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch map image." });
  }

 export default async function handler(req, res) {
  const { address } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY");
    return res.status(500).json({ error: "Server misconfiguration: missing API key." });
  }

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

   export default function handler(req, res) {
  res.status(200).json({ message: "Hello from API" });
}
}
