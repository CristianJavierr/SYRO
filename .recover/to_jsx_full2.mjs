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

// Self-close void elements (but NOT inside style string values — those are in {{}} already)
// Only match actual HTML tags, not content inside style={{ }}
out = out.replace(/<(img|input|br|hr|meta|link|path|circle|rect|use|stop|line|polyline|polygon|ellipse|col|area|base|source|track|wbr)\b([^>]*?)(?<!\/)>/g, (m, tag, attrs) => {
  // Don't touch if inside a style={{ }} context — but regex can't know that
  // Check if attrs contains }} which means we're inside a style value
  if (attrs.includes('}}')) return m; // skip, this is a <path inside a style string
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
// Only replace in actual HTML tag attributes, not inside style={{ }} string values
// We do this before the style conversion... wait, we already did style conversion.
// The svgAttr replacements need to happen ONLY on actual attributes, not inside JSON strings.
// Since style values are now {{...}} with JSON.stringify'd strings, the SVG data URIs inside
// them won't match (they use %22 not real "). But the xmlns:xlink etc are on actual SVG tags.
// Let's be careful: only replace ` xmlns:xlink=` patterns that appear after a tag name.
for (const [k, v] of Object.entries(svgAttrs)) {
  // Replace ` k=` with ` v=` only when preceded by a tag/attribute (not inside a string)
  // Since strings in style={{}} are JSON.stringify'd (with escaped quotes), and HTML attrs use "
  // we can safely replace the attribute name when it's between a space and a quote
  out = out.replace(new RegExp(` ${k}="`, "g"), ` ${v}="`);
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