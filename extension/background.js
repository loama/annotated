const CAPTURE_KEY = "annotatedCapture";

function sourceType(url, hasAudio) {
  const normalized = url.toLowerCase();
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be") || /\.(mp4|webm)(\?|$)/.test(normalized)) return "video";
  if (hasAudio || normalized.includes("podcast") || normalized.includes("spotify.com/episode") || normalized.includes("podcasts.apple.com") || /\.(mp3|m4a|wav)(\?|$)/.test(normalized)) return "podcast";
  return "article";
}

async function storeCapture(value) {
  await chrome.storage.session.set({ [CAPTURE_KEY]: value });
}

async function captureTab(tab) {
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
    await storeCapture({ error: "Open an article, video, or podcast, then click the Annotated toolbar icon again." });
    return;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection()?.toString().trim() || "";
        const audio = document.querySelector("audio");
        const video = document.querySelector("video");
        const image = document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
        return {
          selection: selection.slice(0, 3000),
          title: document.title.slice(0, 300),
          image: /^https?:/.test(image) ? image.slice(0, 2048) : "",
          audioSrc: audio?.currentSrc || audio?.src || "",
          mediaCurrentTime: Math.floor((video || audio)?.currentTime || 0),
          hasAudio: Boolean(audio),
        };
      },
    });

    const page = result?.result || {};
    const startSeconds = Math.max(0, Number(page.mediaCurrentTime) || 0);
    await storeCapture({
      sourceUrl: tab.url,
      sourceTitle: page.title || tab.title || "Untitled source",
      sourceType: sourceType(tab.url, page.hasAudio),
      sourceImage: page.image || "",
      mediaUrl: page.audioSrc && !page.audioSrc.startsWith("blob:") ? page.audioSrc.slice(0, 2048) : "",
      selection: page.selection || "",
      startSeconds,
      endSeconds: startSeconds + 60,
      capturedAt: Date.now(),
    });
  } catch {
    await storeCapture({ error: "Chrome could not read this page. Try a standard article, video, or podcast tab." });
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) void chrome.sidePanel.open({ tabId: tab.id });
  void captureTab(tab);
});
