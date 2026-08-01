import { describe, expect, test } from "bun:test";

type ActionListener = (tab: { id?: number; url?: string; title?: string }) => void;

async function loadBackground(options?: { scriptResult?: Record<string, unknown> }) {
  const source = await Bun.file(new URL("../extension/background.js", import.meta.url)).text();
  let actionListener: ActionListener | undefined;
  const opened: Array<{ tabId: number }> = [];
  const stored: Array<Record<string, unknown>> = [];
  let finishStorage: (() => void) | undefined;
  const storageFinished = new Promise<void>((resolve) => { finishStorage = resolve; });
  const chrome = {
    action: { onClicked: { addListener(listener: ActionListener) { actionListener = listener; } } },
    sidePanel: { async open(input: { tabId: number }) { opened.push(input); } },
    scripting: {
      async executeScript() {
        return [{ result: options?.scriptResult || { selection: "A useful passage", title: "Source title", image: "", audioSrc: "", mediaCurrentTime: 12, hasAudio: false } }];
      },
    },
    storage: {
      session: {
        async set(value: Record<string, unknown>) {
          stored.push(value);
          finishStorage?.();
        },
      },
    },
  };

  new Function("chrome", source)(chrome);
  if (!actionListener) throw new Error("Background script did not register an action listener");
  return { actionListener, opened, stored, storageFinished };
}

describe("Chrome extension capture", () => {
  test("uses the toolbar action to open the side panel and store a bounded capture", async () => {
    const harness = await loadBackground();
    harness.actionListener({ id: 7, url: "https://example.com/article", title: "Fallback title" });
    await harness.storageFinished;

    expect(harness.opened).toEqual([{ tabId: 7 }]);
    expect(harness.stored).toHaveLength(1);
    expect(harness.stored[0]).toEqual({
      annotatedCapture: {
        sourceUrl: "https://example.com/article",
        sourceTitle: "Source title",
        sourceType: "article",
        sourceImage: "",
        mediaUrl: "",
        selection: "A useful passage",
        startSeconds: 12,
        endSeconds: 72,
        capturedAt: expect.any(Number),
      },
    });
  });

  test("stores an actionable error for restricted pages", async () => {
    const harness = await loadBackground();
    harness.actionListener({ id: 8, url: "chrome://extensions", title: "Extensions" });
    await harness.storageFinished;

    expect(harness.opened).toEqual([{ tabId: 8 }]);
    expect(harness.stored[0]).toEqual({
      annotatedCapture: { error: "Open an article, video, or podcast, then click the Annotated toolbar icon again." },
    });
  });

  test("declares only the permissions used by the capture flow", async () => {
    const manifest = await Bun.file(new URL("../extension/manifest.json", import.meta.url)).json();
    expect(manifest.permissions).toEqual(["activeTab", "scripting", "sidePanel", "storage"]);
    expect(manifest.host_permissions).toBeUndefined();
  });
});
