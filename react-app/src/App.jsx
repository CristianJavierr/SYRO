import pageHtml from "./pageHtml.js";

export default function App() {
  return (
    <div
      className="framer-page"
      style={{ minHeight: "100vh" }}
      dangerouslySetInnerHTML={{ __html: pageHtml }}
    />
  );
}