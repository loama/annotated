import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
  test("packages one unmistakable folder that Chrome can load unpacked", async () => {
    const archivePath = fileURLToPath(new URL("../public/annotated-chrome-extension-v1.0.1.zip", import.meta.url));
    const listingProcess = Bun.spawnSync(["/usr/bin/unzip", "-Z1", archivePath]);
    expect(listingProcess.exitCode).toBe(0);

    const listing = listingProcess.stdout.toString().trim().split("\n");
    const installRoot = "Annotated Extension - SELECT THIS FOLDER/";
    expect(listing[0]).toBe(installRoot);
    expect(listing.every((entry) => entry.startsWith(installRoot))).toBe(true);
    expect(listing).toContain(`${installRoot}manifest.json`);
    expect(listing).toContain(`${installRoot}INSTALL.txt`);

    const extractionRoot = await mkdtemp(join(tmpdir(), "annotated-extension-test-"));
    try {
      const extractProcess = Bun.spawnSync(["/usr/bin/unzip", "-q", archivePath, "-d", extractionRoot]);
      expect(extractProcess.exitCode).toBe(0);
      const manifestPath = join(extractionRoot, installRoot, "manifest.json");
      const manifest = await Bun.file(manifestPath).json();
      expect(manifest.manifest_version).toBe(3);

      const referencedFiles = [
        manifest.background.service_worker,
        manifest.side_panel.default_path,
        ...Object.values(manifest.action.default_icon),
        ...Object.values(manifest.icons),
      ] as string[];
      for (const referencedFile of referencedFiles) {
        expect(await Bun.file(join(extractionRoot, installRoot, referencedFile)).exists()).toBe(true);
      }
    } finally {
      await rm(extractionRoot, { recursive: true, force: true });
    }
  });

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

  test("reveals a frame that becomes ready before its capture arrives", async () => {
    const source = await Bun.file(new URL("../extension/sidepanel.js", import.meta.url)).text();
    const elementListeners = new Map<string, Array<() => void>>();
    const windowListeners = new Map<string, Array<(event: unknown) => void>>();
    const storageListeners: Array<(changes: Record<string, { newValue?: unknown }>, areaName: string) => void> = [];
    const posted: unknown[] = [];
    const contentWindow = { postMessage(message: unknown) { posted.push(message); } };
    const elements: Record<string, { hidden: boolean; textContent?: string; src?: string; contentWindow?: typeof contentWindow; addEventListener: (name: string, listener: () => void) => void }> = {};
    for (const id of ["app", "loading", "restricted", "restricted-message", "open"]) {
      elements[id] = {
        hidden: id === "restricted" || id === "app",
        contentWindow: id === "app" ? contentWindow : undefined,
        addEventListener(name, listener) { elementListeners.set(`${id}:${name}`, [...(elementListeners.get(`${id}:${name}`) || []), listener]); },
      };
    }
    const chrome = {
      runtime: { getURL() { return "chrome-extension://abcdefghijklmnopabcdefghijklmnop/"; } },
      tabs: { create() {} },
      storage: {
        session: { async get() { return {}; } },
        onChanged: { addListener(listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void) { storageListeners.push(listener); } },
      },
    };
    const document = { getElementById(id: string) { return elements[id]; } };
    const window = { addEventListener(name: string, listener: (event: unknown) => void) { windowListeners.set(name, [...(windowListeners.get(name) || []), listener]); } };

    new Function("chrome", "document", "window", source)(chrome, document, window);
    await Promise.resolve();
    elementListeners.get("app:load")?.forEach((listener) => listener());
    expect(elements.app.hidden).toBe(true);

    const capture = { sourceUrl: "https://example.com", sourceTitle: "Example", sourceType: "article", startSeconds: 0, endSeconds: 60 };
    storageListeners.forEach((listener) => listener({ annotatedCapture: { newValue: capture } }, "session"));

    expect(elements.app.hidden).toBe(false);
    expect(elements.loading.hidden).toBe(true);
    expect(posted).toContainEqual({ type: "annotated:capture", capture });
  });
});
