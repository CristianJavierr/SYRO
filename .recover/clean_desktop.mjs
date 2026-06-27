import fs from "node:fs";

let h = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_only.html", "utf8");

// 1. Remove hidden- classes from elements (they're all desktop now)
h = h.replace(/ hidden-(?:72rtr7|14q6c4t|l2vx8i|1mjtqlm|128l42z|505v76)/g, "");

// 2. Fix appear animations: opacity:0 -> opacity:1, opacity:0.001 -> opacity:1
h = h.replace(/will-change:transform;opacity:0;/g, "will-change:transform;opacity:1;");
h = h.replace(/will-change:transform;opacity:0"/g, 'will-change:transform;opacity:1"');
h = h.replace(/opacity:0\.001/g, "opacity:1");
h = h.replace(/will-change:transform;opacity:0\./g, "will-change:transform;opacity:1.");
// more general opacity:0 in appear contexts
h = h.replace(/;opacity:0;/g, ";opacity:1;");
h = h.replace(/;opacity:0"/g, ';opacity:1"');

// 3. Reset transform offsets from appear animations (keep translateY(-50%) centering)
h = h.replace(/transform:translateY\(90px\)/g, "transform:none");
h = h.replace(/transform:translateX\(60px\)/g, "transform:none");
h = h.replace(/transform:translateY\(10px\)/g, "transform:none");

// 4. Remove data-framer-appear-id attributes (no JS to fire them)
h = h.replace(/ data-framer-appear-id="[^"]*"/g, "");

// 5. Rewrite asset paths ./assets -> /assets
h = h.replace(/\.\/assets\//g, "/assets/");

// 6. Convert HTML to JSX-safe string:
//    - style="..." already fine for dangerouslySetInnerHTML
//    - We'll keep it as HTML string for now, React will inventory later

// Also remove the Framer badge container content (the "Made in Framer" badge)
// h = h.replace(/<div id="__framer-badge-container"[\s\S]*?<\/div>/, "");

fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_clean.html", h);
console.log("Clean desktop HTML:", h.length, "bytes");
console.log("opacity:0 remaining:", (h.match(/opacity:0[";]/g) || []).length);
console.log("hidden- remaining:", (h.match(/hidden-[a-z0-9]+/g) || []).length);
console.log("appear-id remaining:", (h.match(/data-framer-appear-id/g) || []).length);