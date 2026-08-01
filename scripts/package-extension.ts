import { cp, mkdtemp, mkdir, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceDirectory = join(projectRoot, "extension");
const publicDirectory = join(projectRoot, "public");
const installFolderName = "Annotated Extension - SELECT THIS FOLDER";
const versionedArchive = join(publicDirectory, "annotated-chrome-extension-v1.0.4.zip");
const legacyArchive = join(publicDirectory, "annotated-sidepanel.zip");
const stagingRoot = await mkdtemp(join(tmpdir(), "annotated-extension-"));
const installDirectory = join(stagingRoot, installFolderName);
const archiveTimestamp = new Date("2026-08-01T00:00:00Z");

const installNote = `ANNOTATED FOR CHROME

SELECT THIS ENTIRE FOLDER when Chrome asks which unpacked extension to load.

Do not select manifest.json, an icon, or any other individual file.

1. Open chrome://extensions in Google Chrome.
2. Turn on Developer mode.
3. If an older Annotated version is installed, remove it first so its toolbar
   icon cannot be confused with this update.
4. Click Load unpacked.
5. On macOS, press Command + 2 in the folder dialog to switch to List view.
   Chrome's default Column view can show every file greyed out and disable
   Select. List view enables Select for the extension folder.
6. Select the folder named:
   Annotated Extension - SELECT THIS FOLDER
7. Click Select.

After installation, pin Annotated and click its toolbar icon on an article,
YouTube video, or podcast.
`;

async function normalizeTimestamps(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await normalizeTimestamps(path);
    await utimes(path, archiveTimestamp, archiveTimestamp);
  }
  await utimes(directory, archiveTimestamp, archiveTimestamp);
}

try {
  await mkdir(publicDirectory, { recursive: true });
  await cp(sourceDirectory, installDirectory, { recursive: true });
  await rm(join(installDirectory, "README.md"), { force: true });
  await writeFile(join(installDirectory, "INSTALL.txt"), installNote, "utf8");
  await normalizeTimestamps(installDirectory);

  await Promise.all([
    rm(versionedArchive, { force: true }),
    rm(legacyArchive, { force: true }),
  ]);

  const zip = Bun.spawn(
    ["/usr/bin/zip", "-X", "-q", "-r", versionedArchive, installFolderName],
    { cwd: stagingRoot, stdout: "inherit", stderr: "inherit" },
  );
  const exitCode = await zip.exited;
  if (exitCode !== 0) throw new Error(`zip exited with code ${exitCode}`);

  await cp(versionedArchive, legacyArchive);
  console.log(`Created ${versionedArchive}`);
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}
