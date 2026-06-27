import fs from "node:fs";

const h = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_clean.html", "utf8");

// Split into sections based on identifiable boundaries
// Strategy: find the outer wrapper, then break into sub-blocks by container class

// Get outer wrapper content
const outerRe = /<div class="framer-jCvdL[^"]*"[^>]*>/;
const outerStart = outerRe.exec(h).index;
const outerTagEnd = h.indexOf(">", outerStart) + 1;
// find end of outer wrapper (last </div> in file basically)
const outerEnd = h.lastIndexOf("</div>");

// Inside outer, find depth-1 divs
const inner = h.slice(outerTagEnd, outerEnd);

function splitTopBlocks(str) {
  const blocks = []; let depth = 0; let start = 0;
  const re = /<\/?div\b[^>]*>/g; let m;
  while ((m = re.exec(str))) {
    if (/^<div/i.test(m[0])) {
      if (depth === 0) start = m.index;
      depth++;
    } else {
      depth--;
      if (depth === 0) blocks.push(str.slice(start, m.index + m[0].length));
    }
  }
  return blocks;
}

const blocks = splitTopBlocks(inner);
console.log("Depth-1 blocks:", blocks.length);
blocks.forEach((b, i) => {
  const cls = (b.match(/class="([^"]+)"/) || [])[1] || "";
  const name = (b.match(/data-framer-name="([^"]+)"/) || [])[1] || "";
  const firstText = (b.match(/framer-text">([^<]{3,40})</) || [])[1] || "";
  console.log(i, "len:" + b.length, "cls:" + cls.slice(0, 35), "name:" + JSON.stringify(name), "text:" + JSON.stringify(firstText.slice(0, 25)));
});

// The big blocks — let me inspect their substructure (depth 2)
const big = blocks.filter(b => b.length > 5000);
console.log("\n=== Sub-blocks of large blocks ===");
big.forEach((b, i) => {
  const name = (b.match(/data-framer-name="([^"]+)"/) || [])[1] || "";
  const cls = (b.match(/class="([^"]+)"/) || [])[1] || "";
  const subs = splitTopBlocks(b.replace(/^<div[^>]*>/, "").replace(/<\/div>$/, ""));
  console.log("\nBlock", i, "len:" + b.length, "name:" + name, "cls:" + cls.slice(0, 30));
  subs.forEach((s, j) => {
    const sc = (s.match(/class="([^"]+)"/) || [])[1] || "";
    const sn = (s.match(/data-framer-name="([^"]+)"/) || [])[1] || "";
    const st = (s.match(/framer-text">([^<]{3,40})</) || [])[1] || "";
    if (s.length > 500) console.log("  sub" + j, "len:" + s.length, sc.slice(0, 30), JSON.stringify(sn), JSON.stringify(st.slice(0, 20)));
  });
}