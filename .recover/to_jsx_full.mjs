import fs from "node:fs";

const html = fs.readFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/.recover/desktop_clean.html", "utf8");

function styleToJsx(styleStr) {
  const props = [];
  styleStr.split(";").forEach(pair => {
    const idx = pair.indexOf(":");
    if (idx === -1) return;
    let key = pair.slice(0, idx).trim();
    let val = pair.slice(idx + 1).trim();
    if (!key || !val) return;
    if (key.startsWith("--")) {
      props.push(`'${key}': ${JSON.stringify(val)}`);
      return;
    }
    key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (/^-?\d+(\.\d+)?$/.test(val)) val = String(Number(val));
    else val = JSON.stringify(val);
    props.push(`${key}: ${val}`);
  });
  return `{{ ${props.join(", ")} }}`;
}

let out = html;

// Remove HTML comments
out = out.replace(/<!--[^>]*-->/g, "");

// Convert class -> className
out = out.replace(/\sclass="/g, ' className="');

// Convert style="..." -> style={{...}}
out = out.replace(/\sstyle="([^"]*)"/g, (match, styleStr) => {
  return ' style=' + styleToJsx(styleStr);
});

// Self-close void elements
out = out.replace(/<(img|input|br|hr|meta|link|path|circle|rect|use|stop|line|polyline|polygon|ellipse|col|area|base|source|track|wbr)\b([^>]*?)(?<!\/)>/g, (m, tag, attrs) => {
  return `<${tag}${attrs} />`;
});

// SVG camelCase attributes
const svgAttrs = {
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-dasharray": "strokeDasharray",
  "fill-opacity": "fillOpacity",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "fill-rule": "fillRule",
  "xmlns:xlink": "xmlnsXlink",
  "xlink:href": "xlinkHref",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "text-anchor": "textAnchor",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-weight": "fontWeight",
};
for (const [k, v] of Object.entries(svgAttrs)) {
  out = out.replace(new RegExp(`\\s${k}=`, "g"), ` ${v}=`);
}

// Build the JSX component
const code = `// Auto-generated from Framer desktop DOM — real JSX (no dangerouslySetInnerHTML).
// Edit content/styles directly in this file. HMR reloads on save.
export default function Page() {
  return (
    <div className="framer-page" style={{ minHeight: "100vh", width: "auto" }}>
${out}
    </div>
  );
}
`;

fs.writeFileSync("/Users/cristianjavierguzman/Work/SYRO/V7/react-app/src/Page.jsx", code);
console.log("Page.jsx:", code.length, "bytes");