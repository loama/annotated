const APP_ORIGIN = "https://annotated-beta.vercel.app";
const CAPTURE_KEY = "annotatedCapture";
const appFrame = document.getElementById("app");
const loading = document.getElementById("loading");
const restricted = document.getElementById("restricted");
const restrictedMessage = document.getElementById("restricted-message");
const captureConfirm = document.getElementById("capture-confirm");
const startCaptureButton = document.getElementById("start-capture");
const cancelCaptureButton = document.getElementById("cancel-capture");
const extensionOrigin = chrome.runtime.getURL("").replace(/\/$/, "");
let currentCapture = null;
let frameReady = false;
let pendingVideoRequest = null;
let captureInProgress = false;

async function preparePageVideo(options) {
  const candidates = Array.from(document.querySelectorAll("video"))
    .map((video) => ({ video, rect: video.getBoundingClientRect() }))
    .map(({ video, rect }) => ({
      video,
      rect,
      visibleWidth: Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left)),
      visibleHeight: Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top)),
    }))
    .filter(({ visibleWidth, visibleHeight }) => visibleWidth >= 200 && visibleHeight >= 112)
    .sort((a, b) => (b.visibleWidth * b.visibleHeight) - (a.visibleWidth * a.visibleHeight));
  const selected = candidates[0];
  const video = selected?.video;
  if (!video) throw new Error("No playable video was found in the captured tab.");
  const start = Math.max(0, Math.floor(Number(options.start) || 0));
  const end = Math.max(start + 1, Math.floor(Number(options.end) || start + 1));
  const original = { currentTime: video.currentTime, paused: video.paused, playbackRate: video.playbackRate };

  function waitFor(eventName, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { video.removeEventListener(eventName, ready); reject(new Error("The video did not become ready in time.")); }, timeoutMs);
      function ready() { clearTimeout(timeout); video.removeEventListener(eventName, ready); resolve(); }
      video.addEventListener(eventName, ready, { once: true });
    });
  }

  try {
    const rect = selected.rect;
    if (selected.visibleWidth / rect.width < 0.95 || selected.visibleHeight / rect.height < 0.95) throw new Error("Make the entire YouTube player visible before publishing.");
    if (Number.isFinite(video.duration) && end > Math.floor(video.duration)) throw new Error("The selected end time is past the end of this video.");
    video.pause();
    video.playbackRate = 1;
    video.currentTime = start;
    if (video.seeking || Math.abs(video.currentTime - start) > 0.01) await waitFor("seeked", 10_000);
    if (video.readyState < 2) await waitFor("loadeddata", 10_000);
    return { original, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, viewport: { width: window.innerWidth, height: window.innerHeight } };
  } catch (error) {
    video.playbackRate = original.playbackRate;
    video.currentTime = original.currentTime;
    if (original.paused) video.pause();
    else void video.play().catch(() => undefined);
    throw error;
  }
}

async function playPageVideo() {
  const video = Array.from(document.querySelectorAll("video"))
    .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
  if (!video) throw new Error("The YouTube player is no longer available.");
  await video.play();
}

async function waitForPageVideoEnd(end, timeoutMs) {
  const videos = Array.from(document.querySelectorAll("video"));
  const video = videos.find((candidate) => !candidate.paused) || videos.sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
  if (!video) throw new Error("The YouTube player is no longer available.");
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("The video stalled before the selected end time.")), timeoutMs);
    const interval = setInterval(() => {
      if (video.currentTime >= end - 0.05) finish();
      else if (video.ended) finish(new Error("The video ended before the selected range was complete."));
    }, 100);
    function finish(error) {
      clearTimeout(timeout);
      clearInterval(interval);
      if (error) reject(error);
      else resolve();
    }
  });
}

function restorePageVideo(original) {
  const video = Array.from(document.querySelectorAll("video"))
    .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
  if (!video || !original) return;
  video.playbackRate = original.playbackRate;
  video.currentTime = original.currentTime;
  if (original.paused) video.pause();
  else void video.play().catch(() => undefined);
}

function captureCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.capture({ audio: true, video: true }, (stream) => {
      const error = chrome.runtime.lastError;
      if (error || !stream) reject(new Error(error?.message || "Chrome could not capture the current tab."));
      else resolve(stream);
    });
  });
}

async function recordTabRegion(stream, prepared, duration, startPlayback, waitForEnd, signal) {
  if (typeof MediaRecorder === "undefined") throw new Error("Chrome's video recorder is unavailable.");
  if (signal.aborted) throw new Error("Recording cancelled.");
  const sourceVideo = document.createElement("video");
  let output;
  let audioContext;
  let recorder;
  let drawing = false;

  try {
    sourceVideo.srcObject = stream;
    sourceVideo.muted = true;
    sourceVideo.playsInline = true;
    await sourceVideo.play();
    if (!sourceVideo.videoWidth || !sourceVideo.videoHeight) throw new Error("Chrome could not read the captured tab dimensions.");

    const canvas = document.createElement("canvas");
    canvas.width = 426;
    canvas.height = 240;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Chrome could not prepare the 240p recorder.");
    const scaleX = sourceVideo.videoWidth / prepared.viewport.width;
    const scaleY = sourceVideo.videoHeight / prepared.viewport.height;
    const source = {
      x: Math.max(0, prepared.rect.x * scaleX),
      y: Math.max(0, prepared.rect.y * scaleY),
      width: Math.min(sourceVideo.videoWidth, prepared.rect.width * scaleX),
      height: Math.min(sourceVideo.videoHeight, prepared.rect.height * scaleY),
    };
    if (!source.width || !source.height) throw new Error("The YouTube player is outside the captured tab area.");
    const sourceAspect = source.width / source.height;
    const targetAspect = canvas.width / canvas.height;
    const target = sourceAspect > targetAspect
      ? { width: canvas.width, height: canvas.width / sourceAspect, x: 0, y: (canvas.height - canvas.width / sourceAspect) / 2 }
      : { width: canvas.height * sourceAspect, height: canvas.height, x: (canvas.width - canvas.height * sourceAspect) / 2, y: 0 };

    drawing = true;
    function draw() {
      if (!drawing) return;
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(sourceVideo, source.x, source.y, source.width, source.height, target.x, target.y, target.width, target.height);
      requestAnimationFrame(draw);
    }
    draw();

    output = canvas.captureStream(24);
    stream.getAudioTracks().forEach((track) => output.addTrack(track.clone()));
    if (stream.getAudioTracks().length) {
      audioContext = new AudioContext();
      audioContext.createMediaStreamSource(stream).connect(audioContext.destination);
      if (audioContext.state === "suspended") await audioContext.resume();
    }
    const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = mimeTypes.find((value) => MediaRecorder.isTypeSupported(value)) || "";
    const chunks = [];
    recorder = new MediaRecorder(output, { mimeType, videoBitsPerSecond: 160_000, audioBitsPerSecond: 32_000 });
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error("Chrome could not finish the video recording."));
    });
    recorder.start();
    const recordingStartedAt = performance.now();
    await startPlayback();
    if (signal.aborted) throw new Error("Recording cancelled.");
    const trimStartSeconds = Math.max(0, (performance.now() - recordingStartedAt) / 1000);
    const playbackStartedAt = performance.now();
    await Promise.race([
      waitForEnd(),
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("Recording cancelled.")), { once: true })),
    ]);
    const playbackWallSeconds = (performance.now() - playbackStartedAt) / 1000;
    if (playbackWallSeconds > duration + 0.75) throw new Error("The video buffered during recording. Let the selected range load, then try again.");
    await new Promise((resolve) => setTimeout(resolve, 300));
    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
    if (!blob.size) throw new Error("The captured video was empty.");
    if (blob.size > 4_000_000) throw new Error("The recording was too large to upload. Choose a shorter moment and try again.");
    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (signature.join(",") !== "26,69,223,163") throw new Error("Chrome produced an invalid video recording. Try the capture again.");
    return { blob, contentType: blob.type, trimStartSeconds, durationSeconds: duration };
  } finally {
    drawing = false;
    if (recorder?.state !== "inactive") recorder?.stop();
    output?.getTracks().forEach((track) => track.stop());
    stream.getTracks().forEach((track) => track.stop());
    sourceVideo.pause();
    sourceVideo.srcObject = null;
    await audioContext?.close();
  }
}

function showRestricted(message) {
  loading.hidden = true;
  appFrame.hidden = true;
  restrictedMessage.textContent = message;
  restricted.hidden = false;
}

function sendCapture() {
  if (!frameReady || !currentCapture || currentCapture.error || !appFrame.contentWindow) return;
  appFrame.contentWindow.postMessage({ type: "annotated:capture", capture: currentCapture }, APP_ORIGIN);
}

async function sendAuth() {
  const cookie = await chrome.cookies.get({ url: APP_ORIGIN, name: "annotated_session" });
  appFrame.contentWindow?.postMessage({ type: "annotated:extension-auth", token: cookie?.value || "" }, APP_ORIGIN);
}

function revealApp() {
  if (!frameReady || !currentCapture || currentCapture.error) return;
  restricted.hidden = true;
  loading.hidden = true;
  appFrame.hidden = false;
  sendCapture();
  void sendAuth();
}

function applyCapture(capture) {
  if (pendingVideoRequest) {
    if (pendingVideoRequest.abortController) pendingVideoRequest.abortController.abort();
    else sendVideoError(pendingVideoRequest.requestId, new Error("Recording cancelled because the captured tab changed."));
    resetCapturePrompt();
  }
  currentCapture = capture;
  if (!capture) {
    showRestricted("Click the Annotated toolbar icon on an article, video, or podcast to capture it.");
    return;
  }
  if (capture.error) {
    showRestricted(capture.error);
    return;
  }
  restricted.hidden = true;
  loading.hidden = false;
  appFrame.hidden = true;
  revealApp();
}

function sendVideoError(requestId, reason) {
  appFrame.contentWindow?.postMessage({
    type: "annotated:video-error",
    requestId,
    error: reason instanceof Error ? reason.message : "Chrome could not record this video.",
  }, APP_ORIGIN);
}

function resetCapturePrompt() {
  captureInProgress = false;
  pendingVideoRequest = null;
  startCaptureButton.disabled = false;
  startCaptureButton.textContent = "Start recording";
  cancelCaptureButton.textContent = "Cancel";
  captureConfirm.hidden = true;
}

async function runPendingVideoCapture(request, streamPromise, abortController) {
  let stream;
  let prepared;
  const tabId = Number(request.tabId);
  try {
    stream = await streamPromise;
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id || activeTab.id !== tabId || activeTab.url !== request.sourceUrl) throw new Error("Keep the captured YouTube tab active while Annotated records the selected moment.");
    const [execution] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: preparePageVideo,
      args: [{ start: request.start, end: request.end }],
    });
    prepared = execution?.result;
    if (!prepared?.rect) throw new Error("Chrome could not prepare the YouTube player.");
    startCaptureButton.textContent = "Recording selected moment";
    cancelCaptureButton.textContent = "Stop recording";
    appFrame.contentWindow?.postMessage({ type: "annotated:video-recording", requestId: request.requestId }, APP_ORIGIN);
    const result = await recordTabRegion(
      stream,
      prepared,
      request.end - request.start,
      async () => {
        const [playback] = await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: playPageVideo });
        if (playback?.error) throw new Error("The YouTube player could not start playback.");
      },
      async () => {
        const [completion] = await chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: waitForPageVideoEnd,
          args: [request.end, (request.end - request.start + 20) * 1000],
        });
        if (completion?.error) throw new Error("The video stalled before the selected end time.");
      },
      abortController.signal,
    );
    appFrame.contentWindow?.postMessage({ type: "annotated:video-ready", requestId: request.requestId, ...result }, APP_ORIGIN);
  } catch (reason) {
    stream?.getTracks().forEach((track) => track.stop());
    sendVideoError(request.requestId, reason);
  } finally {
    if (prepared?.original) await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: restorePageVideo, args: [prepared.original] }).catch(() => undefined);
    resetCapturePrompt();
  }
}

appFrame.src = `${APP_ORIGIN}/studio?extension=1&extensionOrigin=${encodeURIComponent(extensionOrigin)}`;
appFrame.addEventListener("load", () => {
  frameReady = true;
  revealApp();
});

window.addEventListener("message", (event) => {
  if (event.origin !== APP_ORIGIN || event.source !== appFrame.contentWindow) return;
  if (event.data?.type === "annotated:ready") {
    frameReady = true;
    revealApp();
    void sendAuth();
    return;
  }
  if (event.data?.type === "annotated:sign-out") {
    void chrome.cookies.remove({ url: APP_ORIGIN, name: "annotated_session" }).then(() => sendAuth());
    return;
  }
  if (event.data?.type === "annotated:cancel-video") {
    if (event.data.requestId === pendingVideoRequest?.requestId) {
      if (pendingVideoRequest.abortController) pendingVideoRequest.abortController.abort();
      else {
        sendVideoError(pendingVideoRequest.requestId, new Error("Recording cancelled."));
        resetCapturePrompt();
      }
    }
    return;
  }
  if (event.data?.type !== "annotated:record-video") return;
  const requestId = String(event.data.requestId || "");
  const start = Math.max(0, Math.floor(Number(event.data.startSeconds) || 0));
  const end = Math.min(start + 90, Math.max(start + 1, Math.floor(Number(event.data.endSeconds) || start + 1)));
  const sourceUrl = String(event.data.sourceUrl || "");
  const tabId = Number(event.data.tabId);
  if (!requestId || currentCapture?.sourceType !== "video") return;
  if (captureInProgress || pendingVideoRequest) return sendVideoError(requestId, new Error("Another recording is already in progress."));
  if (sourceUrl !== currentCapture.sourceUrl || tabId !== currentCapture.tabId) return sendVideoError(requestId, new Error("Capture this YouTube tab again before publishing an edited source."));
  pendingVideoRequest = { requestId, start, end, sourceUrl, tabId };
  captureConfirm.hidden = false;
});

startCaptureButton.addEventListener("click", () => {
  if (!pendingVideoRequest || captureInProgress) return;
  const request = pendingVideoRequest;
  captureInProgress = true;
  startCaptureButton.disabled = true;
  startCaptureButton.textContent = "Preparing recorder";
  const abortController = new AbortController();
  pendingVideoRequest = { ...request, abortController };
  const streamPromise = captureCurrentTab();
  void runPendingVideoCapture(pendingVideoRequest, streamPromise, abortController);
});

cancelCaptureButton.addEventListener("click", () => {
  if (!pendingVideoRequest) return;
  if (pendingVideoRequest.abortController) pendingVideoRequest.abortController.abort();
  else {
    sendVideoError(pendingVideoRequest.requestId, new Error("Recording cancelled."));
    resetCapturePrompt();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "session" && changes[CAPTURE_KEY]) applyCapture(changes[CAPTURE_KEY].newValue || null);
});

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.name === "annotated_session" && changeInfo.cookie.domain.replace(/^\./, "") === new URL(APP_ORIGIN).hostname) void sendAuth();
});

document.getElementById("open").addEventListener("click", () => chrome.tabs.create({ url: APP_ORIGIN }));

chrome.storage.session.get(CAPTURE_KEY).then((stored) => applyCapture(stored[CAPTURE_KEY] || null));
