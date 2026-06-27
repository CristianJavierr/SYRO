import fs from "node:fs";

const h = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_clean.html", "utf8");

// Convert HTML string to a JSX-safe expression (we keep it as a template string,
// but we need to escape backticks and ${} ). We will inject via dangerouslySetInnerHTML
// because the structure is far too complex to hand-convert 220KB to JSX elements.
// BUT: we'll split into section files so it's editable per-section.

// Step 1: identify the big section blocks and split them.

const outerStart = h.indexOf('<div class="framer-jCvdL');
const outerTagEnd = h.indexOf(">", outerStart) + 1;
const outerEnd = h.lastIndexOf("</div>");
const inner = h.slice(outerTagEnd, outerEnd);

function splitTopBlocks(str) {
  const blocks = []; let depth = 0; let start = 0;
  const re = /<\/?div\b[^>]*>/g; let m;
  while ((m = re.exec(str))) {
    if (/^<div/i.test(m[0])) { if (depth === 0) start = m.index; depth++; }
    else { depth--; if (depth === 0) blocks.push(str.slice(start, m.index + m[0].length)); }
  }
  return blocks;
}

const blocks = splitTopBlocks(inner);
// Big blocks are block 0 (main content, len 163916) and block 3 (footer, 52762)
// Actually footer is now ~16K after cleaning. Let me just classify by length.

// Section file mapping based on content text
const sectionNames = [
  { re: /AI Strategy|Custom Agents|Process Automation|Data Intelligence/, file: "Hero" },
  { re: /STATISTICS|Average latency|Tap to watch/, file: "HeroStats" },
  { re: /CASE STUDIES|Proven neural solutions|More Projects/, file: "CaseStudies" },
  { re: /OUR PRODUCT|Build logic at scale/, file: "Product" },
  { re: /PRODUCT STATISTICS|Optimized for performance|System Load|SLA Response|Token Usage/, file: "ProductStats" },
  { re: /OUR APPROACH|Built for the long term|Prime Logic|Total Clarity/, file: "Approach" },
  { re: /PRODUCT FEATURES|Engineered for autonomy/, file: "Features" },
  { re: /INTEGRATIONS|Native System Integrations/, file: "Integrations" },
  { re: /Articles|Insights on neural logic|Buy Armory/, file: "ArticlesCTA" },
  { re: /Quick Links|Home|Pricing|armory|©2026/, file: "Footer" },
];

// The deepest split is too nested. Instead, let's split the main block (block 0)
// by its depth-2 containers that correspond to visible sections.
const mainBlock = blocks.find(b => b.length > 160000);
const footerBlock = blocks.find(b => /Quick Links|©2026/.test(b));

function subBlocks(block) {
  const innerBlock = block.replace(/^<div[^>]*>/, "").replace(/<\/div>$/, "");
  return splitTopBlocks(innerBlock);
}

// Recursively walk to find sections: a sub-block whose total text contains a marker
function walkAndCollect(block, collectors) {
  const subs = subBlocks(block);
  const found = [];
  for (const s of subs) {
    for (const c of collectors) {
      if (c.re.test(s) && !found.find(f => f.file === c.file)) {
        found.push({ file: c.file, html: s });
      }
    }
    if (s.length > 500 && found.length === 0) {
      // go deeper
      const deeper = walkAndCollect(s, collectors);
      deeper.forEach(d => { if (!found.find(f => f.file === d.file)) found.push(d); });
    }
  }
  return found;
}

const collectors = [...sectionNames];
const found = walkAndCollect(mainBlock, collectors);
if (footerBlock) {
  // footer might match multiple; just grab whole footer block
  found.push({ file: "Footer", html: footerBlock });
}

console.log("Found sections:", found.map(f => f.file + ":" + f.html.length).join(", "));

// Save each section html
const OUT = "/Users/cristianjavierguzman/Work/SYRO/V7/react-app/src/sections_html";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let order = [];
for (const f of found) {
  let clean = f.html;
  // rewrite ./assets -> /assets (already done, but ensure)
  clean = clean.replace(/\.\/assets\//g, "/assets/");
  fs.writeFileSync(`${OUT}/${f.file}.html`, clean);
  order.push(f.file);
}
console.log("Saved sections:", order.join(", "));