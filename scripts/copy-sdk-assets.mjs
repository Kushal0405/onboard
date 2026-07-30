import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sdkDist = path.join(rootDir, "sdk", "dist");
const publicSdkDir = path.join(rootDir, "public", "sdk");

if (!existsSync(sdkDist)) {
  console.error(`[copy-sdk-assets] sdk/dist not found at ${sdkDist} — run the sdk build first.`);
  process.exit(1);
}

mkdirSync(publicSdkDir, { recursive: true });
cpSync(sdkDist, publicSdkDir, { recursive: true });
console.log(`[copy-sdk-assets] copied sdk/dist -> public/sdk`);
