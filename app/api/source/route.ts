import { load } from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { sourceDomain, youtubeId } from "@/lib/rules";
import { assertPublicHttpUrl, fetchPublic } from "@/lib/public-url";

export const dynamic = "force-dynamic";

function absolute(value: string | undefined, base: URL) {
  if (!value) return "";
  try { return new URL(value, base).toString(); }
  catch { return ""; }
}

export async function POST(request: NextRequest) {
  let input: { url?: string; type?: "video" | "article" | "podcast" };
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!input.url || !input.type) return NextResponse.json({ error: "Source URL and type are required" }, { status: 400 });
  try {
    const url = assertPublicHttpUrl(input.url);
    const videoId = youtubeId(url.toString());
    if (videoId) {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url.toString())}&format=json`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error("YouTube could not read this video");
      const metadata = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
      return NextResponse.json({ title: metadata.title || "YouTube video", publisher: metadata.author_name || "YouTube", image: metadata.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, mediaUrl: "" });
    }

    if (/\.(mp3|m4a|wav|ogg|aac)(\?|$)/i.test(url.pathname)) return NextResponse.json({ title: url.pathname.split("/").pop() || "Audio source", publisher: sourceDomain(url.toString()), image: "", selection: "", mediaUrl: url.toString() });
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url.pathname)) return NextResponse.json({ title: url.pathname.split("/").pop() || "Video source", publisher: sourceDomain(url.toString()), image: "", selection: "", mediaUrl: url.toString() });

    const response = await fetchPublic(url, { cache: "no-store", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "Mozilla/5.0 (compatible; Annotated/1.0; +https://annotated-beta.vercel.app)" } });
    if (!response.ok) throw new Error(`The source returned ${response.status}`);
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > 3_000_000) throw new Error("The source page is too large to analyze safely");
    const html = (await response.text()).slice(0, 3_000_000);
    const $ = load(html, { xmlMode: /xml|rss/.test(response.headers.get("content-type") || "") });
    const title = $("meta[property='og:title']").attr("content") || $("title").first().text().trim() || $("h1").first().text().trim() || "Untitled source";
    const publisher = $("meta[property='og:site_name']").attr("content") || $("meta[name='author']").attr("content") || sourceDomain(url.toString());
    const image = absolute($("meta[property='og:image']").attr("content") || $("meta[name='twitter:image']").attr("content"), url);
    const description = $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "";
    const passage = $("article p, main p, [role='main'] p, p").toArray().map((element) => $(element).text().replace(/\s+/g, " ").trim()).find((text) => text.length >= 80 && text.length <= 1200) || description;
    const mediaUrl = absolute(
      $("meta[property='og:audio']").attr("content") ||
      $("meta[property='og:audio:url']").attr("content") ||
      $("meta[name='twitter:player:stream']").attr("content") ||
      $("audio").attr("src") ||
      $("audio source").attr("src") ||
      $("enclosure").attr("url"),
      url,
    );
    return NextResponse.json({ title: title.slice(0, 220), publisher: publisher.slice(0, 120), image, selection: passage.slice(0, 1200), mediaUrl });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Source analysis failed" }, { status: 422 });
  }
}
