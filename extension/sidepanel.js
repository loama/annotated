const APP_ORIGIN = "https://annotated-beta.vercel.app";
const appFrame = document.getElementById("app");
const loading = document.getElementById("loading");
const restricted = document.getElementById("restricted");

function sourceType(url, hasAudio) {
  const normalized = url.toLowerCase();
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be") || /\.(mp4|webm)(\?|$)/.test(normalized)) return "video";
  if (hasAudio || normalized.includes("podcast") || normalized.includes("spotify.com/episode") || normalized.includes("podcasts.apple.com") || /\.(mp3|m4a|wav)(\?|$)/.test(normalized)) return "podcast";
  return "article";
}

async function readCurrentPage() {
  loading.hidden = false;
  restricted.hidden = true;
  appFrame.hidden = true;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url || /^(chrome|edge|about|chrome-extension):/.test(tab.url)) {
    loading.hidden = true;
    restricted.hidden = false;
    return;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection()?.toString().trim() || "";
        const audio = document.querySelector("audio");
        const video = document.querySelector("video");
        const description = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
        const image = document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
        return {
          selection: selection.slice(0, 3000),
          title: document.title,
          description: description.slice(0, 500),
          image,
          audioSrc: audio?.currentSrc || audio?.src || "",
          mediaCurrentTime: Math.floor((video || audio)?.currentTime || 0),
          hasAudio: Boolean(audio),
        };
      },
    });

    const page = result?.result || {};
    const params = new URLSearchParams({
      extension: "1",
      source: tab.url,
      title: page.title || tab.title || "Untitled source",
      type: sourceType(tab.url, page.hasAudio),
      start: String(page.mediaCurrentTime || 0),
      end: String((page.mediaCurrentTime || 0) + 60),
    });
    if (page.selection) params.set("selection", page.selection);
    if (page.audioSrc && !page.audioSrc.startsWith("blob:")) params.set("media", page.audioSrc);
    appFrame.src = `${APP_ORIGIN}/studio?${params.toString()}`;
    appFrame.onload = () => {
      loading.hidden = true;
      appFrame.hidden = false;
    };
  } catch {
    loading.hidden = true;
    restricted.hidden = false;
  }
}

document.getElementById("refresh").addEventListener("click", readCurrentPage);
document.getElementById("retry").addEventListener("click", readCurrentPage);
document.getElementById("open").addEventListener("click", () => chrome.tabs.create({ url: APP_ORIGIN }));
readCurrentPage();
