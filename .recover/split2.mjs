import fs from "node:fs";

const h = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_clean.html", "utf8");

const outerRe = /<div class="framer-jCvdL[^"]*"[^>]*>/;
const outerStart = outerRe.exec(h).index;
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
console.log("Depth-1 blocks:", blocks.length);
blocks.forEach((b, i) => {
  const cls = (b.match(/class="([^"]+)"/) || [])[1] || "";
  const name = (b.match(/data-framer-name="([^"]+)"/) || [])[1] || "";
  console.log(i, "len:" + b.length, "cls:" + cls.slice(0, 35), "name:" + JSON.stringify(name));
});

const big = blocks.filter(b => b.length > 5000);
console.log("\n=== Sub-blocks ===");
big.forEach((b, i) => {
  const name = (b.match(/data-framer-name="([^"]+)"/) || [])[1] || "";
  console.log("\n# Block idx with len", b.length, "name", name);
  const subs = splitTopBlocks(b.replace(/^<div[^>]*>/, "").replace(/<\/div>$/, ""));
  subs.forEach((s, j) => {
    if (s.length < 500) return;
    const sc = (s.match(/class="([^"]+)"/) || [])[1] || "";
    const sn = (s.match(/data-framer-name="([^"]+)"/) || [])[1] || "";
    const st = (s.match(/framer-text"[^>]*>([^<]{3,40})</) || [])[1] || "";
    console.log("  sub" + j, "len:" + s.length, sc.slice(0, 28), JSON.stringify(sn), JSON.stringify(st.slice(0, 20)));
  });
});