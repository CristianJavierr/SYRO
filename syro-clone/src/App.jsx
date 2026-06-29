import React, { useEffect } from "react";
import { pageHtml } from "./pageHtml";

export default function App() {
  useEffect(() => {
    document.body.classList.add("is-loading");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("visible", entry.isIntersecting);
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".services, .service-card").forEach((el) => observer.observe(el));

    let disposed = false;

    const startPageScripts = async () => {
      const loadingFallback = window.setTimeout(() => {
        document.body.classList.remove("is-loading", "entry-window", "entry-open");
      }, 4500);

      await import("../main.js");

      try {
        await import("../js/distort.js");
      } catch (error) {
        console.warn("Hero distortion script did not start", error);
      }

      if (disposed) {
        window.clearTimeout(loadingFallback);
        return;
      }

      document.dispatchEvent(new Event("DOMContentLoaded", {
        bubbles: true,
        cancelable: true,
      }));

      try {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const fluidModule = await import("../js/fluid.js");
        fluidModule.initSyroFluid?.();
      } catch (error) {
        console.warn("Fluid script did not start", error);
      }

      window.setTimeout(() => window.clearTimeout(loadingFallback), 5000);
    };

    startPageScripts();

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHtml }} />;
}
