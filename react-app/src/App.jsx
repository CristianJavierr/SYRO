import mainInner from "./mainInner.js";

// Root component — renders the exact Framer DOM.
// To edit a section, extract it from mainInner.js into its own component.
export default function App() {
  return (
    <div
      id="main"
      data-framer-hydrate-v2=""
      style={{ minHeight: "100%" }}
      dangerouslySetInnerHTML={{ __html: mainInner }}
    />
  );
}