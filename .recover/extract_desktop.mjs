import fs from "node:fs";

const h = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/main_inner.html", "utf8");

// Strip ssr-variant wrappers that are NOT desktop (hidden-l2vx8i = mobile, hidden-14q6c4t = tablet)
// Keep only desktop variants (no hidden class, or hidden-72rtr7 which is desktop's own hidden mask)
// Strategy: find <div class="ssr-variant hidden-l2vx8i...">...</div> and remove
// and <div class="ssr-variant hidden-14q6c4t...">...</div>

function removeSsrVariants(html, filterRegex) {
  // find <div class="ssr-variant FILTER...">  and its matching </div>
  let out = "";
  let i = 0;
  while (i < html.length) {
    const tagStart = html.indexOf('<div class="ssr-variant', i);
    if (tagStart === -1) { out += html.slice(i); break; }
    out += html.slice(i, tagStart);
    // get this ssr-variant block
    const tagEnd = html.indexOf(">", tagStart);
    const tag = html.slice(tagStart, tagEnd + 1);
    if (filterRegex.test(tag)) {
      // find matching closing </div>
      let depth = 1;
      let j = tagEnd + 1;
      const re = /<\/?div\b[^>]*>/g;
      re.lastIndex = j;
      let m;
      while ((m = re.exec(html)) && m.index < html.length) {
        if (/^<div/i.test(m[0])) depth++;
        else depth--;
        if (depth === 0) { j = m.index + m[0].length; break; }
      }
      // skip this block entirely
      i = j;
    } else {
      out += tag;
      i = tagEnd + 1;
    }
  }
  return out;
}

// Remove mobile (hidden-l2vx8i) and tablet (hidden-14q6c4t) and phone variants
let cleaned = h;
cleaned = removeSsrVariants(cleaned, /hidden-l2vx8i/);
cleaned = removeSsrVariants(cleaned, /hidden-14q6c4t/);
// also remove the badge Framer promo
// remove the <style data-framer-html-style> blocks (duplicate body background)
cleaned = cleaned.replace(/<style data-framer-html-style>[^<]*<\/style>/g, "");

fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_only.html", cleaned);
console.log("Original:", h.length, "-> Desktop-only:", cleaned.length);
console.log("Saved desktop_only.html");

// Show structure of what remains (top section names)
const nameRe = /data-framer-name="([^"]+)"/g;
const names = new Set();
let m;
while ((m = nameRe.exec(cleaned))) names.add(m[1]);
console.log("Unique framer-names in desktop-only:", names.size);
console.log("Sample:", [...names].slice(0, 30).join(", "));