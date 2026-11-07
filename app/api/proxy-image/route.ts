export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  if (!targetUrl) return new Response("Missing url", { status: 400 });

  const referer = searchParams.get("ref") || "https://truyenqq.com.vn/";

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        referer,
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return new Response("Failed upstream: " + res.status, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const body = await res.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
