# Annotated Chrome side panel

## Install the developer preview

1. Keep the entire **Annotated Extension - SELECT THIS FOLDER** folder together.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked**.
5. On macOS, press **Command + 2** in the folder dialog to switch to List view. This enables the **Select** button. Chrome's default Column view can leave Select disabled even when the correct folder is highlighted.
6. Select the whole **Annotated Extension - SELECT THIS FOLDER** folder, then choose **Select**. Do not select `manifest.json` or another individual file.
7. Pin Annotated, then click its toolbar action beside any article, YouTube video, or podcast.

The extension opens as a native Chrome side panel. It reads only the active page when you click its toolbar icon. Click the icon again on another page to capture a new source. Selected text and media timing are passed directly into the annotation studio in your browser.

The extension has host access only to https://annotated-beta.vercel.app. Its cookie permission reads only the Annotated session cookie so the side panel can use an existing Annotated sign-in. It has no host permission for YouTube cookies. Microphone access is requested by Chrome only when you choose to record audio commentary.

When you publish a YouTube annotation, the extension asks you to confirm with a Start recording button that belongs to the extension itself. Annotated then records only the fully visible player area and tab audio for the selected range, up to 90 seconds. Keep the player visible and the side panel open until recording finishes. The recording stays in your browser until it is uploaded to Annotated for exact-range 240p encoding. No YouTube cookies are read or stored.

Annotated does not collect browser history or monitor pages in the background. Read the full privacy policy at https://annotated-beta.vercel.app/privacy.
