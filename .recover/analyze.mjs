import fs from "node:fs";
import path from "node:path";
const DIR = "/Users/cristianjavierguzman/Work/SYRO/V7/.recover/src_modules";
const files = fs.readdirSync(DIR).filter(f => f.endsWith(".js"));

// each original URL's id = last segment before .js (the module file name)
function idOfLocalFile(fn) {
  // fn like framerusercontent.com__modules__AAA__BBB__ID.js  or __sites__... (mjs-source) or mapsource
  const base = fn.replace(/\.js$/, "");
  const parts = base.split("__");
  return parts[parts.length - 1];
}

// Collect imports
const imports = []; // {srcFile, srcId, specifiers:[...bindings], from}
const remoteUrlToLocal = {}; // url -> localFile
const totalIdToLocal = {}; // id -> [localFiles]  (canvas components)
const idToNames = {}; // id -> Set(defaultImportNames)

const impRegex = /import\s+(?:(\*\s+as\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:,\s*(\*\s+as\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+))?\s*from\s*"([^"]+)"/g;

for (const f of files) {
  const id = idOfLocalFile(f);
  totalIdToLocal[id] = totalIdToLocal[id] || [];
  totalIdToLocal[id].push(f);
  const txt = fs.readFileSync(path.join(DIR, f), "utf8");
  let m;
  impRegex.lastIndex = 0;
  while ((m = impRegex.exec(txt))) {
    const from = m[4];
    const defaultBind = (m[1] && m[1].replace(/\*\s+as\s+/, "")) || (m[3] && m[3].replace(/\*\s+as\s+/, "")) || "";
    const named = m[2] ? m[2].split(",").map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean) : [];
    imports.push({ srcFile: f, srcId: id, from, defaultBind, named });
    if (from.startsWith("https://")) {
      remoteUrlToLocal[from] = remoteUrlToLocal[from] || [];
      const tgtId = from.split("/").pop().replace(/\.js$/, "").split("?")[0];
      if (defaultBind) (idToNames[tgtId] = idToNames[tgtId] || new Set()).add(defaultBind);
    }
    if (from.startsWith("#framer/local/canvasComponent/")) {
      const cid = from.split("/")[4];
      if (defaultBind) (idToNames[cid] = idToNames[cid] || new Set()).add(defaultBind);
    }
  }
}

// Pick semantic name per id
function cleanName(s) { return s.replace(/[^A-Za-z0-9_$/]/g, ""); }
const idToName = {};
for (const [id, set] of Object.entries(idToNames)) {
  // prefer a name that is PascalCase/meaningful (not a randomized id-like string)
  const names = [...set];
  const good = names.find(n => /^[A-Z][a-zA-Z0-9_$]{2,}$/.test(n) && !/^[A-Za-z0-9]{10,}$/.test(n)) || names.find(n => /^[A-Z]/.test(n));
  if (good) idToName[id] = cleanName(good);
}

const out = {
  files: files.length,
  ids: Object.keys(totalIdToLocal).length,
  idToNameSample: Object.fromEntries(Object.entries(idToName).slice(0, 60)),
  idToNamesRaw: Object.fromEntries(Object.entries(idToNames).map(([k,v]) => [k, [...v]])),
};
fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/analysis.json", JSON.stringify(out, null, 2));
console.log("files:", files.length, "ids:", Object.keys(totalIdToLocal).length, "named ids:", Object.keys(idToName).length);
console.log("sample idToName:", Object.entries(idToName).slice(0, 40).map(([k,v])=>k+"="+v).join(", "));