import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const source = join(process.cwd(), "docs", "01kit-guide.md");
const targetDir = join(process.cwd(), "site", "public", "docs");

await mkdir(targetDir, { recursive: true });
await copyFile(source, join(targetDir, "01kit-guide.md"));
console.log("Synced guide markdown to site/public/docs");
