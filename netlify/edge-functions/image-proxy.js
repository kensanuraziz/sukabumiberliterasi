export default async (request, context) => {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("id");
  
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return new Response("Missing or invalid file ID", { status: 400 });
  }

  const googleUrl = `https://lh3.googleusercontent.com/d/${fileId}=w400`;
  
  try {
    const imgRes = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Netlify Edge Function)'
      }
    });

    if (!imgRes.ok) {
      return new Response("Image not found", { status: 404 });
    }

    const imageData = await imgRes.arrayBuffer();

    return new Response(imageData, {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "public, max-age=86400, s-maxage=86400",
        "access-control-allow-origin": "*"
      }
    });
  } catch (e) {
    console.error("Image proxy error:", e);
    return new Response("Error fetching image", { status: 500 });
  }
};
