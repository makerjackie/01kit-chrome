import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const source = join(process.cwd(), "docs", "ai-chrome-extension-guide.md");
const targetDir = join(process.cwd(), "site", "public", "docs");

await mkdir(targetDir, { recursive: true });
await copyFile(source, join(targetDir, "ai-chrome-extension-guide.md"));
console.log("Synced tutorial markdown to site/public/docs");
