import fs from "node:fs";
import path from "node:path";
import { getBin, head, DL, MODS } from "./net.mjs";

const seen = new Set();
const queue = [];
const manifest = []; // {url, file, kind, bytes}
const moduleUrls = new Set();
const assetUrls = new Set();
const mapMissing = new Set();

const seedBundles = fs.readFileSync(path.join(DL, "bundle_urls.txt"), "utf8").trim().split("\n").filter(Boolean);
const seedModules = [
  "https://framerusercontent.com/modules/tXS9Kr2KmhOAR36kYPLD/gXbEmLsHOciqyeBkwPVC/augiA20Il.js",
  "https://framerusercontent.com/modules/609El2xVM4wIxv9QQmvd/FQzL1oRXPwNOJ7puIzk8/JxkXufefU.js",
  "https://framerusercontent.com/modules/cOeeYv0YzZ2X2V76GIge/MqMoZphsojicRytTBG5d/snippets.js",
  "https://framerusercontent.com/modules/3ChHXDWZq3dPg8AsIPD5/30t0Y5eAWOIoLY1Rcdon/ZESyTEvnR.js",
  "https://framerusercontent.com/modules/9DKYqcDkXF0r74wg3u7H/6FZyhVHrOmJj09QWjeUx/PQDU294s0.js",
  "https://framerusercontent.com/modules/IJFFrMTS8jMcG2TEkK8e/BZ4ukp9k93RKpbvfsTDv/c_LE9Dhpo.js",
  "https://framerusercontent.com/modules/oDJ0PhY0gCtNuhizZUwr/drJBTQ44iA6hGK5Z2yHE/pbTETus5o.js",
  "https://framerusercontent.com/modules/TNyavLXTI4uTBS1TAe7M/b0ulwonAVlTa4r6YvXkH/VBh12KI8r.js",
  "https://framerusercontent.com/modules/gLkhZUg1gOVdt1OwC6Ts/90PGTV6CUzKHxUutPTQe/spJpQskuY.js",
  "https://framerusercontent.com/modules/jMwe1ntiPGGxYXTCI8om/OKMDEXOARD6P4taOEkd8/hSYYuztEH.js",
  "https://framerusercontent.com/modules/fCL88BYGujaLvR3RX2vG/3kdcVrSn227MifHW9pVe/CnS17Ja8P.js",
  "https://framerusercontent.com/modules/AWRja2hHwn6wnCWAXpEn/sTAS33JBmGGHqziR9gcc/IXkrB0mip.js",
  "https://framerusercontent.com/modules/v4XMfgI9vPF41aNAOyM0/9UvT2xA7YamlpNvKKHgV/bXbQpP0GQ.js",
  "https://framerusercontent.com/modules/IJY6PuLvXIqqEWEDe4yh/hbhGUkjiYnGjkVaT0WOp/fsRev258H.js",
  "https://framerusercontent.com/modules/NcRZfMzfn0lwLIXV0Vyz/0jt8NXdmHckMmIN8Eg4L/RPT4GBlcY.js",
];

seedBundles.forEach(u => queue.push({ url: u, kind: "bundle" }));
seedModules.forEach(u => queue.push({ url: u, kind: "module" }));

function safeName(url) {
  return url.replace(/^https?:\/\//, "").replace(/\?.*$/, "").replace(/[\/]/g, "__");
}

function extractUrls(text) {
  const out = new Set();
  const re = /https:\/\/framerusercontent\.com\/[^"' )]+/g;
  let m;
  while ((m = re.exec(text))) out.add(m[0]);
  return [...out];
}

async function processBundle(url) {
  const { status, body } = await getBin(url);
  if (status !== 200) return;
  const base = url.split("/").pop(); // x.mjs
  fs.writeFileSync(path.join(DL, base), body);
  // try map
  const mapUrl = url + ".map";
  const mapRes = await getBin(mapUrl);
  if (mapRes.status === 200 && mapRes.body) {
    fs.writeFileSync(path.join(DL, base + ".map"), mapRes.body);
    try {
      const map = JSON.parse(mapRes.body.toString("utf8"));
      const sources = map.sources || [];
      const contents = map.sourcesContent || [];
      sources.forEach((src, i) => {
        if (!contents[i]) return;
        let content = contents[i];
        // resolve to url
        let realUrl = src;
        if (src.startsWith("framer:")) return; // toplevel synthesis
        realUrl = "https://" + src.replace(/^https?:\/?\/?/, "");
        const fn = safeName(realUrl);
        fs.writeFileSync(path.join(MODS, fn), content);
        manifest.push({ url: realUrl, file: fn, kind: "mapsource", bytes: content.length });
        moduleUrls.add(realUrl);
        // scan content for nested module urls
        for (const u of extractUrls(content)) {
          if (u.endsWith(".js") || u.endsWith(".mjs")) moduleUrls.add(u);
          else assetUrls.add(u);
        }
      });
    } catch (e) { mapMissing.add(mapUrl); }
  } else {
    mapMissing.add(mapUrl);
  }
  // scan the mjs itself for asset/module urls
  const txt = body.toString("utf8");
  for (const u of extractUrls(txt)) {
    if (u.endsWith(".js") || u.endsWith(".mjs")) moduleUrls.add(u);
    else assetUrls.add(u);
  }
}

async function processModule(url) {
  const { status, body } = await getBin(url);
  if (status !== 200) { mapMissing.add(url); return; }
  const fn = safeName(url);
  fs.writeFileSync(path.join(MODS, fn), body);
  manifest.push({ url, file: fn, kind: "module", bytes: body.length });
  moduleUrls.add(url);
  for (const u of extractUrls(body.toString("utf8"))) {
    if (u.endsWith(".js") || u.endsWith(".mjs")) moduleUrls.add(u);
    else assetUrls.add(u);
  }
}

// run with simple concurrency
async function runQueue() {
  let idx = 0;
  const workers = 8;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= queue.length) break;
      const item = queue[i];
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      try {
        if (item.kind === "bundle") await processBundle(item.url);
        else await processModule(item.url);
      } catch (e) {
        mapMissing.add(item.url + " :: " + e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: workers }, worker));
}

await runQueue();

// second pass: new module urls discovered
let added = 0;
for (const u of moduleUrls) {
  if (!seen.has(u) && (u.endsWith(".js") || u.endsWith(".mjs"))) {
    queue.push({ url: u, kind: u.endsWith(".mjs") ? "bundle" : "module" });
    added++;
  }
}
if (added) await runQueue();
// third pass
added = 0;
for (const u of moduleUrls) {
  if (!seen.has(u) && (u.endsWith(".js") || u.endsWith(".mjs"))) {
    queue.push({ url: u, kind: u.endsWith(".mjs") ? "bundle" : "module" });
    added++;
  }
}
if (added) await runQueue();

fs.writeFileSync(path.join(DL, "manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(DL, "module_urls.txt"), [...moduleUrls].sort().join("\n"));
fs.writeFileSync(path.join(DL, "asset_urls.txt"), [...assetUrls].sort().join("\n"));
fs.writeFileSync(path.join(DL, "missing.txt"), [...mapMissing].sort().join("\n"));

console.log("bundles:", seedBundles.length, "modules fetched unique:", manifest.filter(m=>m.kind==="module").length, "mapsources:", manifest.filter(m=>m.kind==="mapsource").length);
console.log("asset urls:", assetUrls.size, "module urls:", moduleUrls.size, "missing:", mapMissing.size);