import fs from "node:fs";

const html = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/offline/index.html", "utf8");

// 1. Extract the <head> contents (fonts/style) and the <body> #main contents separately.
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
const head = headMatch ? headMatch[1] : "";

// The main content: find <div id="main" ...>....</div> that closes before #svg-templates
const mainStart = html.indexOf('<div id="main"');
const svgTemplatesStart = html.indexOf('<div id="svg-templates"');
const mainBlock = html.slice(mainStart, svgTemplatesStart);
// strip the closing tag area
const mainInnerStart = mainBlock.indexOf(">") + 1;
const mainInner = mainBlock.slice(mainInnerStart, mainBlock.lastIndexOf("</div>"));

// 2. Find top-level children of #main that have data-framer-name
// We'll find all data-framer-name attributes and their positions
const nameRe = /data-framer-name="([^"]+)"/g;
const names = [];
let m;
while ((m = nameRe.exec(mainInner))) {
  // find the <div or <a that contains this — back up to the opening tag
  const pos = m.index;
  const tagStart = mainInner.lastIndexOf("<", pos);
  const tag = mainInner.slice(tagStart, pos + m[0].length);
  names.push({ name: m[1], pos, tagStart, tagSnippet: tag.slice(0, 120) });
}

// 3. Find section boundaries: look for top-level <div> that wraps a big chunk
// Strategy: find the substring positions of `data-framer-name=` occurrences at shallow depth.
// Simpler: list the names that appear near the start of big top-level divs.
console.log("Total data-framer-name in #main:", names.length);
console.log("First 60 names:");
names.slice(0, 60).forEach((n, i) => console.log(i, JSON.stringify(n.name), n.pos));

fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/main_inner.html", mainInner);
fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/head_block.html", head);
console.log("\nmain_inner.html bytes:", mainInner.length, "head bytes:", head.length);