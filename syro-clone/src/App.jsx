import React, { useEffect } from "react";
import { pageHtml } from "./pageHtml";

export default function App() {
  useEffect(() => {
    document.body.classList.add("is-loading");

    const seedFluidInitialFrame = () => {
      const container = document.getElementById("fluid-container");
      const render = container?.querySelector(".render");

      if (!container || !render || render.textContent.trim()) return;

      const targetLongSide = 128 * 74;
      const minGridSize = 8;
      const cellCropX = 1;
      const cellCropY = 2;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const gridSize = Math.max(Math.round(Math.sqrt((width * height) / targetLongSide)), minGridSize);
      const realWidth = Math.ceil(width / gridSize + cellCropX * 2) * gridSize;
      const realHeight = Math.ceil(height / gridSize + cellCropY * 2) * gridSize;
      const xResolution = realWidth / gridSize;
      const yResolution = realHeight / gridSize;
      const chars = [" ", " ", ".", "-", ":", "~", "s", "Y", "R", "O"];
      const rows = [];

      render.style.width = `${realWidth}px`;
      render.style.height = `${(yResolution - cellCropY * 2) * gridSize}px`;
      document.documentElement.style.setProperty("--cell-size", `${gridSize}px`);

      for (let y = yResolution - cellCropY; y > cellCropY; y -= 1) {
        let row = "";

        for (let x = cellCropX; x < xResolution - cellCropX; x += 1) {
          const dx = (x - xResolution / 2) / (xResolution * 0.32);
          const dy = (y - yResolution / 2) / (yResolution * 0.24);
          const ring = Math.abs(Math.sqrt(dx * dx + dy * dy) - 1);
          const diagonal = Math.sin(x * 0.21 + y * 0.17) * 0.18;
          const intensity = Math.max(0, Math.min(1, 1 - ring * 4 + diagonal));
          row += chars[Math.floor(intensity * (chars.length - 1))];
        }

        rows.push(row);
      }

      render.textContent = rows.join("\n");
      container.classList.add("is-fluid-seeded");
    };

    seedFluidInitialFrame();

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
        seedFluidInitialFrame();
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
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHtml }} />;
}
