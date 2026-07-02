import React, { useEffect } from "react";
import { pageHtml } from "./pageHtml";

// Helper to retry dynamic script imports in case of network drops or 404s
const importWithRetry = async (importFn, retries = 3, delay = 1000) => {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Import Retry] Failed to load module. Retrying in ${delay}ms... (${retries} attempts left)`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return importWithRetry(importFn, retries - 1, delay * 1.5);
    } else {
      console.error("[Import Retry] Ultimate failure. Force-reloading page to fetch latest asset hashes...", error);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      throw error;
    }
  }
};

if (typeof document !== "undefined") {
  document.documentElement.classList.add("js");
  document.body.classList.add("is-loading");
}

export default function App() {
  useEffect(() => {
    document.body.classList.add("is-loading");

    const runPerformanceBenchmark = () => {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      let multiplier = 1.0;

      if (cores <= 2 || memory <= 2) {
        multiplier = 1.6;
      } else if (cores <= 4 || memory <= 4) {
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

      let logoRetries = 0;
      const loadLogo = () => {
        logo.src = logoRetries === 0 
          ? "./assets/image 63 (2).svg" 
          : `./assets/image 63 (2).svg?t=${Date.now()}`;
      };

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
        if (logoRetries < 3) {
          logoRetries++;
          console.warn(`[Logo Retry] Initial SVG failed to load. Retrying in 1000ms... (attempt ${logoRetries})`);
          setTimeout(loadLogo, 1000);
        } else {
          console.error("[Logo Retry] Initial SVG failed to load after all retries.");
          delete container.dataset.seedPending;
        }
      };

      loadLogo();
    };

    seedFluidInitialFrame();

    let disposed = false;

    const startPageScripts = async () => {
      const loadingFallback = window.setTimeout(() => {
        document.documentElement.classList.add("animations-ready");
        document.body.classList.remove("is-loading", "entry-window", "entry-open");
      }, 9000);
      const fluidModulePromise = importWithRetry(() => import("../js/fluid.js"))
        .catch((error) => {
          console.warn("Fluid script did not start", error);
          return null;
        });

      try {
        await importWithRetry(() => import("../main.js"));
      } catch (error) {
        console.error("Main script failed to load:", error);
      }

      try {
        await importWithRetry(() => import("../js/distort.js"));
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
        const fluidModule = await fluidModulePromise;
        fluidModule?.initSyroFluid?.();
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
