import fs from "node:fs";
import path from "node:path";

const OFF = "/Users/cristianjavierguzman/Work/SYRO/V7/offline";
const APP = "/Users/cristianjavierguzman/Work/SYRO/V7/react-app";

// 1. Extract head CSS (two <style> blocks: data-framer-font-css + data-framer-emotion)
const html = fs.readFileSync(path.join(OFF, "index.html"), "utf8");
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
const head = headMatch ? headMatch[1] : "";

// Pull out <style ...>...</style> blocks
const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
let styles = "";
let sm;
while ((sm = styleRe.exec(head))) styles += sm[1] + "\n";

// Pull out <link rel="stylesheet"> none here — all inline
fs.writeFileSync(path.join(APP, "src/styles.css"), styles);

// 2. Extract #main inner HTML (already done in main_inner.html)
const mainInner = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/main_inner.html", "utf8");

// 3. Extract token CSS variables from :root (Framer uses var(--token-...))
// Already in styles

// 4. Copy assets folder to react-app/public/assets
const ASSETS_SRC = path.join(OFF, "assets");
const ASSETS_DST = path.join(APP, "public/assets");
// Use cp -R via execSync for speed (452 files)
import { execSync } from "node:child_process";
execSync(`cp -R "${ASSETS_SRC}" "${ASSETS_DST}"`);
// also mjs
execSync(`cp -R "${path.join(OFF, "mjs")}" "${path.join(APP, "public/mjs")}"`);

console.log("styles.css:", styles.length, "bytes");
console.log("main_inner:", mainInner.length, "bytes");
console.log("assets copied");