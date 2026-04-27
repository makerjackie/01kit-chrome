import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join(process.cwd(), ".output");
const downloadDir = join(process.cwd(), "site", "public", "downloads");
const files = await readdir(outputDir);
const zip = files.find((file) => file.endsWith(".zip"));

if (!zip) {
  throw new Error("No extension zip found in .output");
}

await mkdir(downloadDir, { recursive: true });
await copyFile(join(outputDir, zip), join(downloadDir, "01kit-chrome.zip"));
console.log(`Copied ${zip} to site/public/downloads/01kit-chrome.zip`);
