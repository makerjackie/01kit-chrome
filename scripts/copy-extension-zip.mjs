import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join(process.cwd(), ".output");
const downloadDir = join(process.cwd(), "site", "public", "downloads");
const files = await readdir(outputDir);
const zipFiles = files.filter((file) => file.endsWith(".zip"));

if (zipFiles.length === 0) {
  throw new Error("No extension zip found in .output");
}

const zipsByModifiedTime = await Promise.all(
  zipFiles.map(async (file) => ({
    file,
    mtimeMs: (await stat(join(outputDir, file))).mtimeMs
  }))
);
const zip = zipsByModifiedTime.sort((a, b) => b.mtimeMs - a.mtimeMs)[0].file;

await mkdir(downloadDir, { recursive: true });
await copyFile(join(outputDir, zip), join(downloadDir, "01kit-chrome.zip"));
console.log(`Copied ${zip} to site/public/downloads/01kit-chrome.zip`);
