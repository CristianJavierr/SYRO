import React, { useLayoutEffect } from "react";
import { pageHtml } from "./pageHtml";
import { getProductPageHtml, productPages } from "./productPages";

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
  document.documentElement.classList.remove("animations-ready");
  document.body.classList.add("is-loading");
  document.body.classList.remove("is-leaving", "entry-window", "entry-open");
}

const setupInternalPageTransitions = () => {
  let navigating = false;
  let navigationTimer = 0;

  const handleNavigation = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const url = new URL(link.href, window.location.href);
    const isSameDocument =
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (url.origin !== window.location.origin || isSameDocument || navigating) return;

    event.preventDefault();
    navigating = true;

    const loader = document.querySelector(".entry-loader");
    loader?.classList.remove("is-releasing");
    document.body.classList.remove("entry-window", "entry-open");
    document.body.classList.add("is-leaving");

    navigationTimer = window.setTimeout(() => {
      window.location.assign(url.href);
    }, 420);
  };

  document.addEventListener("click", handleNavigation);

  return () => {
    window.clearTimeout(navigationTimer);
    document.removeEventListener("click", handleNavigation);
  };
};

function HomePage() {
  useLayoutEffect(() => {
    const loader = document.querySelector(".entry-loader");

    document.body.classList.add("is-loading");
    document.body.classList.remove(
      "is-leaving",
      "product-route",
      "product-ready",
      "entry-window",
      "entry-open"
    );
    document.documentElement.classList.remove("animations-ready");
    loader?.classList.remove("is-releasing");

    const cleanupPageTransitions = setupInternalPageTransitions();

    const header = document.querySelector(".site-header");
    const menuToggle = document.querySelector(".menu-toggle");
    const siteNav = document.querySelector(".site-nav");
    const menuLinks = siteNav?.querySelectorAll("a") ?? [];
    let menuOpen = false;

    const setMenuState = (isOpen, { returnFocus = false } = {}) => {
      menuOpen = isOpen;
      header?.classList.toggle("is-menu-open", isOpen);
      document.body.classList.toggle("menu-open", isOpen);
      menuToggle?.setAttribute("aria-expanded", String(isOpen));
      menuToggle?.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
      siteNav?.setAttribute("aria-hidden", String(!isOpen));

      if (isOpen) {
        window.lenis?.stop?.();
        window.requestAnimationFrame(() => menuLinks[0]?.focus());
      } else {
        window.lenis?.start?.();
        if (returnFocus) menuToggle?.focus();
      }
    };

    const toggleMenu = () => setMenuState(!menuOpen);
    const closeFromLink = () => setMenuState(false);
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuState(false, { returnFocus: true });
      }
    };

    menuToggle?.addEventListener("click", toggleMenu);
    menuLinks.forEach((link) => link.addEventListener("click", closeFromLink));
    document.addEventListener("keydown", closeOnEscape);

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
        document.body.classList.remove("is-loading");
        window.setTimeout(() => {
          document.body.classList.remove("entry-window", "entry-open");
        }, 520);
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
      menuToggle?.removeEventListener("click", toggleMenu);
      menuLinks.forEach((link) => link.removeEventListener("click", closeFromLink));
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("menu-open");
      cleanupPageTransitions();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHtml }} />;
}

function ProductPage({ product }) {
  useLayoutEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionMeta?.getAttribute("content") ?? "";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introDuration = reduceMotion ? 80 : 720;
    const revealTargets = [...document.querySelectorAll("[data-product-reveal]")];
    const anchorLinks = [...document.querySelectorAll('a[href^="#"]')];
    const progressBar = document.querySelector(".entry-progress-bar");
    const progressFill = document.querySelector(".entry-progress-bar__fill");
    const loader = document.querySelector(".entry-loader");

    document.title = `${product.name} — SYRO`;
    descriptionMeta?.setAttribute("content", product.description);
    document.body.classList.add("product-route", "is-loading");
    document.body.classList.remove(
      "is-leaving",
      "product-ready",
      "menu-open",
      "entry-window",
      "entry-open"
    );
    document.documentElement.classList.remove("animations-ready");
    loader?.classList.remove("is-releasing");
    revealTargets.forEach((target) => target.classList.remove("is-visible"));

    const cleanupPageTransitions = setupInternalPageTransitions();

    if (progressBar) {
      progressBar.style.transform = "scaleX(1)";
      progressBar.style.opacity = "1";
    }

    const progressAnimation = progressFill?.animate(
      [
        { transform: "scaleX(0)" },
        { transform: "scaleX(0.72)", offset: 0.68 },
        { transform: "scaleX(1)" },
      ],
      {
        duration: introDuration,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));

    const handleAnchorClick = (event) => {
      const target = document.querySelector(event.currentTarget.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    };

    anchorLinks.forEach((link) => link.addEventListener("click", handleAnchorClick));

    const releaseTimer = window.setTimeout(() => {
      loader?.classList.add("is-releasing");
    }, Math.max(0, introDuration - 480));

    const readyTimer = window.setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("product-ready");
      document.documentElement.classList.add("animations-ready");
    }, introDuration);

    const loaderResetTimer = window.setTimeout(() => {
      loader?.classList.remove("is-releasing");
    }, introDuration + 520);

    return () => {
      window.clearTimeout(releaseTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(loaderResetTimer);
      progressAnimation?.cancel();
      revealObserver.disconnect();
      anchorLinks.forEach((link) => link.removeEventListener("click", handleAnchorClick));
      cleanupPageTransitions();
      loader?.classList.remove("is-releasing");
      document.body.classList.remove(
        "product-route",
        "product-ready",
        "is-loading",
        "is-leaving"
      );
      document.title = previousTitle;
      if (previousDescription) {
        descriptionMeta?.setAttribute("content", previousDescription);
      }
    };
  }, [product]);

  return <div dangerouslySetInnerHTML={{ __html: getProductPageHtml(product) }} />;
}

export default function App() {
  const pathParts =
    typeof window === "undefined"
      ? []
      : window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const productSlug =
    pathParts.length === 2 && pathParts[0] === "productos" ? pathParts[1] : null;
  const product = productSlug ? productPages[productSlug] : null;

  return product ? <ProductPage product={product} /> : <HomePage />;
}
