const APP_ORIGIN = "https://annotated-beta.vercel.app";
const CAPTURE_KEY = "annotatedCapture";
const appFrame = document.getElementById("app");
const loading = document.getElementById("loading");
const restricted = document.getElementById("restricted");
const restrictedMessage = document.getElementById("restricted-message");
const extensionOrigin = chrome.runtime.getURL("").replace(/\/$/, "");
let currentCapture = null;

function showRestricted(message) {
  loading.hidden = true;
  appFrame.hidden = true;
  restrictedMessage.textContent = message;
  restricted.hidden = false;
}

function sendCapture() {
  if (!currentCapture || currentCapture.error || !appFrame.contentWindow) return;
  appFrame.contentWindow.postMessage({ type: "annotated:capture", capture: currentCapture }, APP_ORIGIN);
}

function applyCapture(capture) {
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
  sendCapture();
}

appFrame.src = `${APP_ORIGIN}/studio?extension=1&extensionOrigin=${encodeURIComponent(extensionOrigin)}`;
appFrame.addEventListener("load", sendCapture);

window.addEventListener("message", (event) => {
  if (event.origin !== APP_ORIGIN || event.source !== appFrame.contentWindow || event.data?.type !== "annotated:ready") return;
  sendCapture();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "session" && changes[CAPTURE_KEY]) applyCapture(changes[CAPTURE_KEY].newValue || null);
});

document.getElementById("open").addEventListener("click", () => chrome.tabs.create({ url: APP_ORIGIN }));

chrome.storage.session.get(CAPTURE_KEY).then((stored) => applyCapture(stored[CAPTURE_KEY] || null));

appFrame.addEventListener("load", () => {
  if (!currentCapture || currentCapture.error) return;
  loading.hidden = true;
  appFrame.hidden = false;
});
