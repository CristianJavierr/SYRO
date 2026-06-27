import fs from "node:fs";
import path from "node:path";
import { getBin, DL } from "./net.mjs";

const PROJ = "/Users/cristianjavierguzman/Work/SYRO/V7";
const OFF = path.join(PROJ, "offline");
const ASSETS = path.join(OFF, "assets");
const MJS = path.join(OFF, "mjs");
fs.mkdirSync(ASSETS, { recursive: true });
fs.mkdirSync(MJS, { recursive: true });

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
let html = fs.readFileSync("/tmp/armory_index.html", "utf8");

// collect all https framerusercontent + gstatic urls (incl query)
const urlSet = new Set();
const reAll = /https:\/\/(?:framerusercontent\.com|fonts\.gstatic\.com|fonts\.googleapis\.com)\/[^"')\s<>]+/g;
let m;
while ((m = reAll.exec(html))) urlSet.add(m[0]);

// Build htmlForm (raw, with &amp;) for rewriting and fetchForm (& decoded) for download
const pairs = [...urlSet].map(raw => ({ htmlForm: raw, fetchForm: raw.replace(/&amp;/g, "&") }));

// separate js (mjs) from assets
const jsUrls = pairs.filter(p => p.htmlForm.endsWith(".mjs")).map(p => p.fetchForm);
const assetPairs = pairs.filter(p => !p.htmlForm.endsWith(".mjs"));

// also add bundle mjs from bundle_urls.txt (modulepreload fully captured)
const bundleUrls = fs.readFileSync(path.join(DL, "bundle_urls.txt"), "utf8").trim().split("\n").filter(Boolean);
bundleUrls.forEach(u => jsUrls.push(u));

// also pull additional https .mjs dynamically referenced discovered in crawl
const discovered = fs.existsSync(path.join(DL, "module_urls.txt"))
  ? fs.readFileSync(path.join(DL, "module_urls.txt"), "utf8").trim().split("\n").filter(Boolean)
  : [];
discovered.forEach(u => { if (u.endsWith(".mjs")) jsUrls.push(u); else if (u && /^https:\/\//.test(u)) assetPairs.push({ htmlForm: u, fetchForm: u }); });

const uniqJs = [...new Set(jsUrls.filter(u => /^https:\/\//.test(u)))];
const uniqAssetPairs = [...new Set(assetPairs.map(p => p.htmlForm))].map(htmlForm => {
  const p = assetPairs.find(x => x.htmlForm === htmlForm); return p;
});

function fileFor(url) {
  const u = url.replace(/^https?:\/\//, "");
  const clean = u.replace(/[\/\\]/g, "__").replace(/[?&=]/g, "_");
  return clean.length > 180 ? clean.slice(0, 170) + "__" + Buffer.from(url).toString("hex").slice(0, 8) : clean;
}

const map = {}; // htmlForm -> local relative path
async function download(list, dir, relPrefix) {
  let i = 0, ok = 0, fail = 0;
  const workers = 12;
  async function w() {
    while (true) {
      const idx = i++;
      if (idx >= list.length) break;
      const { htmlForm, fetchForm } = list[idx];
      const fn = fileFor(fetchForm);
      const local = relPrefix + fn;
      map[htmlForm] = local;
      const out = path.join(dir, fn);
      if (fs.existsSync(out) && fs.statSync(out).size > 0) { ok++; continue; }
      try {
        const { status, body } = await getBin(fetchForm);
        if (status === 200 && body && body.length) {
          fs.writeFileSync(out, body);
          ok++;
        } else { fail++; console.error("FAIL", status, fetchForm); }
      } catch (e) { fail++; console.error("ERR", fetchForm, e.message); }
    }
  }
  await Promise.all(Array.from({ length: workers }, w));
  console.log(`downloaded ${ok} (fail ${fail}) into ${dir}`);
}

await download(uniqAssetPairs, ASSETS, "./assets/");
// rewrite asset URLs in html (replace htmlForm with local)
for (const htmlForm of Object.keys(map)) {
  html = html.split(htmlForm).join(map[htmlForm]);
}

// download mjs, map URL-> ./mjs/file, rewrite modulepreload/script hrefs/src
const mjsMap = {};
let i2 = 0;
const mw = 12;
async function mwork() {
  while (true) {
    const idx = i2++;
    if (idx >= uniqJs.length) break;
    const url = uniqJs[idx];
    const base = url.split("/").pop().split("?")[0];
    const local = "./mjs/" + base;
    mjsMap[url] = local;
    const out = path.join(MJS, base);
    if (fs.existsSync(out) && fs.statSync(out).size > 0) continue;
    try {
      const { status, body } = await getBin(url);
      if (status === 200) fs.writeFileSync(out, body);
    } catch (e) { console.error("mjs err", url, e.message); }
  }
}
await Promise.all(Array.from({ length: mw }, mwork));
console.log("mjs files:", Object.keys(mjsMap).length);

// rewrite js URLs in html
for (const url of Object.keys(mjsMap)) {
  html = html.split(url).join(mjsMap[url]);
}

// also fetch .map for each mjs (nice for offline editing of bundles)
let mi = 0;
async function mmap() {
  while (true) {
    const idx = mi++;
    if (idx >= uniqJs.length) break;
    const url = uniqJs[idx] + ".map";
    const base = url.split("/").pop().split("?")[0];
    const out = path.join(MJS, base);
    if (fs.existsSync(out)) continue;
    try { const { status, body } = await getBin(url); if (status === 200) fs.writeFileSync(out, body); } catch {}
  }
}
await Promise.all(Array.from({ length: 8 }, mmap));

fs.writeFileSync(path.join(OFF, "index.html"), html);
fs.writeFileSync(path.join(OFF, "url_map.json"), JSON.stringify({ assets: map, mjs: mjsMap }, null, 2));
console.log("DONE. offline/index.html written.", html.length, "bytes");