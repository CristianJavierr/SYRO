import React, { useEffect } from "react";
import { pageHtml } from "./pageHtml";

if (typeof document !== "undefined") {
  document.documentElement.classList.add("js");
  document.body.classList.add("is-loading");
}

export default function App() {
  useEffect(() => {
    document.body.classList.add("is-loading");

    const runPerformanceBenchmark = () => {
      const start = performance.now();
      let val = 0;
      // Run 500,000 mathematical iterations to measure CPU speed
      for (let i = 0; i < 500000; i++) {
        val += Math.sin(i) * Math.cos(i);
      }
      const duration = performance.now() - start;
      console.log(`[Fluid Benchmark] Performance test took ${duration.toFixed(2)}ms`);

      // Fast (<5ms): 1.0x, Medium (5ms-15ms): 1.25x (fewer cells), Slow (>15ms): 1.6x (even fewer cells)
      let multiplier = 1.0;
      if (duration > 15) {
        multiplier = 1.6;
      } else if (duration > 5) {
        multiplier = 1.25;
      }
      window.fluidGridMultiplier = multiplier;
    };

    runPerformanceBenchmark();

    const seedFluidInitialFrame = () => {
      const container = document.getElementById("fluid-container");
      const render = container?.querySelector(".render");

      if (
        !container ||
        !render ||
        render.textContent.trim() ||
        container.dataset.seedPending === "true" ||
        container.classList.contains("is-fluid-ready")
      ) {
        return;
      }

      const baseTarget = 128 * 74;
      const perfMultiplier = window.fluidGridMultiplier || 1.0;
      const targetLongSide = baseTarget / (perfMultiplier * perfMultiplier);

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

      render.style.width = `${realWidth}px`;
      render.style.height = `${(yResolution - cellCropY * 2) * gridSize}px`;
      document.documentElement.style.setProperty("--cell-size", `${gridSize}px`);

      const logo = new Image();
      logo.decoding = "async";
      container.dataset.seedPending = "true";

      logo.onload = () => {
        delete container.dataset.seedPending;

        if (container.classList.contains("is-fluid-ready") || render.textContent.trim()) return;

        const offscreen = document.createElement("canvas");
        offscreen.width = xResolution;
        offscreen.height = yResolution;
        const ctx = offscreen.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const logoAspect = 2889 / 1849;
        const isMobile = window.matchMedia("(max-width: 768px)").matches || xResolution < yResolution;
        const scaleY = yResolution * (isMobile ? 0.24 : 0.45);
        const scaleX = scaleY * logoAspect;
        const dx = (xResolution - scaleX) / 2;
        const dy = (yResolution - scaleY) / 2;

        ctx.clearRect(0, 0, xResolution, yResolution);
        ctx.save();
        ctx.translate(xResolution, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(logo, dx, dy, scaleX, scaleY);
        ctx.restore();

        const pixels = ctx.getImageData(0, 0, xResolution, yResolution).data;
        const chars = [" ", "·", "-", ":", "~", "s", "Y", "R", "O"];
        const rows = [];

        for (let y = yResolution - cellCropY; y > cellCropY; y -= 1) {
          let row = "";

          for (let x = cellCropX; x < xResolution - cellCropX; x += 1) {
            const alpha = pixels[(y * xResolution + x) * 4 + 3];
            row += alpha > 40 ? chars[1 + ((x + y) % (chars.length - 1))] : " ";
          }

          rows.push(row);
        }

        render.textContent = rows.join("\n");
        container.classList.add("is-fluid-seeded");
      };

      logo.onerror = () => {
        delete container.dataset.seedPending;
      };

      logo.src = "./assets/image 63 (2).svg";
    };

    seedFluidInitialFrame();

    let disposed = false;

    const startPageScripts = async () => {
      const loadingFallback = window.setTimeout(() => {
        document.documentElement.classList.add("animations-ready");
        document.body.classList.remove("is-loading", "entry-window", "entry-open");
      }, 9000);

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

      document.addEventListener("syro:animations-ready", () => window.clearTimeout(loadingFallback), { once: true });

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

    };

    startPageScripts();

    return () => {
      disposed = true;
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHtml }} />;
}
