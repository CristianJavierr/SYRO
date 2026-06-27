import fs from "node:fs";

const html = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_clean.html", "utf8");

// Escape backticks and ${} for a JS template literal
const escaped = html
  .replace(/`/g, "\\`")
  .replace(/\$\{/g, "\\${");

const js = `// Auto-generated from desktop_clean.html — exact Framer desktop DOM, cleaned.
// Edit this string to change the page content. HMR reloads on save.
export const pageHtml = \`${escaped}\`;
`;

fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/react-app/src/pageHtml.js", js);
console.log("pageHtml.js:", js.length, "bytes");