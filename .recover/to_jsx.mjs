import fs from "node:fs";

// Convert HTML string to a JSX element expression (string returned for embedding in a .jsx file)
// We keep the DOM exact but convert attribute syntax to JSX.

function styleToJsx(styleStr) {
  // styleStr like "opacity:1;transform:none;--token-xxx: rgb(26,26,26)"
  const props = {};
  styleStr.split(";").forEach(pair => {
    const idx = pair.indexOf(":");
    if (idx === -1) return;
    let key = pair.slice(0, idx).trim();
    let val = pair.slice(idx + 1).trim();
    if (!key || !val) return;
    // CSS custom property: keep as quoted string key
    if (key.startsWith("--")) {
      props["'" + key + "'"] = val;
      return;
    }
    // camelCase
    key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    // numeric values without units -> number
    if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    props[key] = val;
  });
  // Build object literal
  const entries = Object.entries(props).map(([k, v]) => {
    const valStr = typeof v === "number" ? v : JSON.stringify(String(v).replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
    return `${k}: ${valStr}`;
  });
  return "{{" + entries.join(", ") + "}}";
}

function convertHtmlToJsx(html) {
  let out = html;
  // Convert class="..." -> className="..."
  out = out.replace(/\sclass="/g, ' className="');
  // Convert style="..." -> style={{...}}
  out = out.replace(/\sstyle="([^"]*)"/g, (match, styleStr) => {
    return ' style=' + styleToJsx(styleStr);
  });
  // Convert for= -> htmlFor=
  out = out.replace(/\sfor="/g, ' htmlFor="');
  // Self-close void tags that aren't already
  out = out.replace(/<(img|input|br|hr|meta|link|path|circle|rect|use|stop|line|polyline|polygon|ellipse|col)([^>]*?)(?<!\/)>/g, '<$1$2 />');
  // SVG attributes: stroke-width -> strokeWidth, stroke-linecap -> strokeLineCap, etc.
  out = out.replace(/stroke-width/g, "strokeWidth");
  out = out.replace(/stroke-linecap/g, "strokeLinecap");
  out = out.replace(/stroke-linejoin/g, "strokeLinejoin");
  out = out.replace(/stroke-miterlimit/g, "strokeMiterlimit");
  out = out.replace(/stroke-dasharray/g, "strokeDasharray");
  out = out.replace(/fill-opacity/g, "fillOpacity");
  out = out.replace(/clip-path/g, "clipPath");
  out = out.replace(/xmlns:xlink/g, "xmlnsXlink");
  out = out.replace(/xlink:href/g, "xlinkHref");
  out = out.replace(/aria-hidden/g, "aria-hidden"); // keep
  // Remove HTML comments
  out = out.replace(/<!--\$?-->?/g, "");
  return out;
}

const DIR = "/Users/cristianjavierguzman/Work/SYRO/V7/react-app/src/sections_html";
const OUT = "/Users/cristianjavierguzman/Work/SYRO/V7/react-app/src/sections";
fs.mkdirSync(OUT, { recursive: true });

const order = JSON.parse(fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/section_order.json", "utf8"));

for (const name of order) {
  const html = fs.readFileSync(`${DIR}/${name}.html`, "utf8");
  const jsx = convertHtmlToJsx(html);
  // Wrap in a component
  const code = `export default function ${name}() {
  return (
    <div className="${name.toLowerCase()}-section">${jsx}</div>
  );
}
`;
  fs.writeFileSync(`${OUT}/${name}.jsx`, code);
  console.log(name + ".jsx:", code.length, "bytes");
}