import fs from "node:fs";
import path from "node:path";

const SRC = "/Users/cristianjavierguzman/Work/SYRO/V7/.recover/src_modules";
const OUT = "/Users/cristianjavierguzman/Work/SYRO/V7/src";
const ANALYSIS = JSON.parse(fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/analysis.json", "utf8"));

// normalize id: strip trailing .js
const normId = s => s.replace(/\.js$/i, "");

const idToName = {}; // normalized id -> [names]
for (const [k, v] of Object.entries(ANALYSIS.idToNamesRaw)) {
  (idToName[normId(k)] = idToName[normId(k)] || []).push(...v);
}

// Build map of recovered files keyed by normalized id
const files = fs.readdirSync(SRC).filter(f => f.endsWith(".js"));
const idToFile = {};          // normId -> [files]
for (const f of files) {
  const base = f.replace(/\.js$/, "");
  const parts = base.split("__");
  let id = normId(parts[parts.length - 1]);
  (idToFile[id] = idToFile[id] || []).push(f);
}

// Pick semantic name per id (PascalCase preferred)
function cleanName(s) { return s.replace(/[^A-Za-z0-9_$]/g, ""); }
const idToSemantic = {};
for (const [id, names] of Object.entries(idToName)) {
  const good = names.find(n => /^[A-Z][a-zA-Z0-9_$]{2,}$/.test(n) && !/^[A-Za-z0-9]{12,}$/.test(n))
             || names.find(n => /^[A-Z]/.test(n));
  if (good) idToSemantic[id] = cleanName(good);
}

// Target path per normalized id
const idToTarget = {}; // normId -> {file, dir, name}
const usedNames = {};
function targetFor(id) {
  if (idToTarget[id]) return idToTarget[id];
  const candidates = idToFile[id] || [];
  if (!candidates.length) return null;
  // prefer the largest file (the real full component) over small shims/metadata wrappers
  const file = candidates
    .map(f => ({ f, sz: fs.statSync(path.join(SRC, f)).size }))
    .sort((a, b) => b.sz - a.sz)[0].f;
  let name = idToSemantic[id] || id;
  // disambiguate
  let unique = name;
  if (usedNames[unique]) { usedNames[unique]++; unique = name + "__" + id.slice(0, 6); }
  else usedNames[unique] = 1;
  const dir = "components";
  return (idToTarget[id] = { file, dir, name: unique });
}

// Decide folder: pages have route ids; everything else -> components. Keep simple: all in flat components/ with semantic names.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT + "/components", { recursive: true });
fs.mkdirSync(OUT + "/pages", { recursive: true });
fs.mkdirSync(OUT + "/styles", { recursive: true });
fs.mkdirSync(OUT + "/shared", { recursive: true });

const PAGE_IDS = new Set(["augiA20Il","PQDU294s0","c_LE9Dhpo","ZESyTEvnR","pbTETus5o","VBh12KI8r","spJpQskuY","hSYYuztEH","CnS17Ja8P","IXkrB0mip","JxkXufefU","A1iUPLFsp","snippets"]);
// Footer JxkXufefU & A1iUPLFsp etc.

const impRegex = /import\s*(?:(\*\s*as\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:,\s*(\*\s*as\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+))?\s*from\s*"([^"]+)"/g;

function placeFile(id) {
  if (PAGE_IDS.has(id)) return "pages";
  return "components";
}

function classify(name) {
  // shared styles / utils by module bundle names or id patterns
  return "components";
}

const written = []; // {id, dir, file, name}
for (const id of Object.keys(idToFile)) {
  const tgt = targetFor(id);
  if (!tgt) continue;
  const dir = placeFile(id);
  const srcPath = path.join(SRC, tgt.file);
  let txt = fs.readFileSync(srcPath, "utf8");
  // rewrite imports
  txt = txt.replace(impRegex, (match, d1, named, d2, from) => {
    let newFrom = from;
    if (from === "framer" || from === "framer-motion" || from === "react" || from === "react-dom" || from === "react-dom/client" || from === "react/jsx-runtime") {
      newFrom = from; // bare — resolved by bundler/dep
    } else if (from.startsWith("#framer/local/")) {
      const parts = from.split("/");
      const kind = parts[2];
      let cid = (kind === "codeFile") ? normId(parts[parts.length - 1]) : (parts[3] || normId(parts[parts.length - 1]));
      const t = targetFor(normId(cid)) || (kind === "codeFile" && targetFor(parts[3]));
      if (t) newFrom = relativeSpecifier(dir, t.dir, t.name);
    } else if (from.startsWith("https://")) {
      const urlClean = from.split("?")[0];
      const fid = normId(urlClean.split("/").pop());
      const t = targetFor(fid);
      if (t) newFrom = relativeSpecifier(dir, t.dir, t.name);
    }
    if (newFrom === from) return match;
    // replace the quoted specifier (works with or without space before `from`)
    return match.replace('"' + from + '"', '"' + newFrom + '"');
  });
  const outPath = path.join(OUT, dir, tgt.name + ".jsx");
  fs.writeFileSync(outPath, txt);
  written.push({ id, dir, file: outPath.replace(OUT + "/", ""), name: tgt.name });
  // write any sibling candidates (e.g. small page-metadata wrappers) so nothing is lost
  const sibs = (idToFile[id] || []).filter(f => f !== tgt.file);
  sibs.forEach((sb, n) => {
    const rewritten = rewriteImports(fs.readFileSync(path.join(SRC, sb), "utf8"), dir);
    fs.writeFileSync(path.join(OUT, dir, tgt.name + "__sibling" + n + ".jsx"), rewritten);
  });
}

function rewriteImports(txt, dir) {
  return txt.replace(impRegex, (match, d1, named, d2, from) => {
    let newFrom = from;
    if (from === "framer" || from === "framer-motion" || from === "react" || from === "react-dom" || from === "react-dom/client" || from === "react/jsx-runtime") {
      return match;
    } else if (from.startsWith("#framer/local/")) {
      const parts = from.split("/");
      const kind = parts[2];
      let cid = (kind === "codeFile") ? normId(parts[parts.length - 1]) : (parts[3] || normId(parts[parts.length - 1]));
      const t = targetFor(normId(cid)) || (kind === "codeFile" && targetFor(parts[3]));
      if (t) newFrom = relativeSpecifier(dir, t.dir, t.name);
    } else if (from.startsWith("https://")) {
      const urlClean = from.split("?")[0];
      const fid = normId(urlClean.split("/").pop());
      const t = targetFor(fid);
      if (t) newFrom = relativeSpecifier(dir, t.dir, t.name);
    }
    if (newFrom === from) return match;
    return match.replace('"' + from + '"', '"' + newFrom + '"');
  });
}

function relativeSpecifier(fromDir, toDir, name) {
  // fromDir/toDir are like "components" or "pages"; compute relative from a file in fromDir to a file name in toDir
  if (fromDir === toDir) return "./" + name + ".jsx";
  return "../" + toDir + "/" + name + ".jsx";
}

fs.writeFileSync(OUT + "/manifest.json", JSON.stringify(written, null, 2));
console.log("written:", written.length, "files -> src/");
console.log("with semantic name:", Object.keys(idToSemantic).length, "/ ids:", Object.keys(idToFile).length);