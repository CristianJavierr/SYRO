# Armory AI — Exact Downloaded Clone

Exact, downloadable clone of **https://armory.framer.ai/** (a Framer-built site).
Two layers are included:

1. `offline/` — the **downloaded page**, pixel-exact, runs locally with all assets (images, fonts, videos, JS bundles) localized. No internet required to view.
2. `src/` — the **exact editable React/JSX source**, de-bundled from Framer's production bundles via the source maps the site accidentally shipped. This is the real component code as generated, not a recreation.

## How Framer sites work (important)

Framer compiles your canvas into generated React modules. In production it serves:
- the **SSR'd HTML** (full rendered DOM + inline CSS) — this is what you see;
- **minified `.mjs` bundles** that hydrate/animate/navigate.

The original, readable React source is **not** shipped — it lives inside Framer's editor. **This site, however, left source maps (`*.mjs.map`) published.** Those maps embed the pre-bundled, readable source via `sourcesContent`, including the per-component module URLs. That's how `src/` was recovered — it is the genuine generated code, de-bundled.

## Running the downloaded page

```bash
npm install
npm run serve      # zero-dep local server → http://localhost:4173/
# or
npm run dev        # Vite dev server on the offline folder → http://localhost:5173/
```

Open the URL. The page renders identically to the live site because the HTML is the server-rendered DOM and all 452 assets (96 images, ~96 font files, 3 videos) are served locally from `offline/assets/`.

> Note: deep client-side navigation to other routes (`/pricing`, `/about`, …) and Framer's appear/hover interactions are driven by Framer's runtime which lazy-loads modules through Framer's private `#framer/local` loader. Those work only against Framer's CDN (online). The home page you see on `https://armory.framer.ai/` is rendered fully offline here.

## The editable source (`src/`)

```
src/
  pages/        # route page modules (augiA20Il = home, PQDU294s0 = pricing, …)
  components/   # every canvas component, named where recoverable
                 (Navbar, FAQ, BlogCard, CaseStudyCard, PrimaryButton,
                  CTA, TestimonialsSection, ServiceCard1/2/3Center,
                  AILogos, StatisticsCard, TokenUsage, Footer, …)
  manifest.json # id → exported file name mapping
```

- 147 `.jsx` files recovered, 265 cross-imports rewritten to local relative paths.
- 71 components got their real semantic name (e.g. `Navbar.jsx`); the rest keep their Framer ID (e.g. `dctoRyc_W.jsx`).
- A handful of imports still point to Framer-SDK platform modules (`framer.com/m/*`, a few `useControlledState`/`variantUtils` utils, and a few page-specific canvas components not reachable from the home-page bundles). Those are marked inline and are Framer-internal; they cannot be recovered without the original Framer project file.

### Why `src/` won't `npm run start` as a live React app

These files import `from "framer"` and `from "react"` as **bare specifiers**, and use `#framer/local/...` virtual imports that Framer resolves only inside its own runtime/server. There is no public `framer` runtime that exports this exact canvas API (`withCSS`, `getFontsFromSharedStyle`, `GeneratedComponentContext`, …) for a standalone dev server. Wiring that up would require reimplementing Framer's private loader — out of scope.

You **can** still use `src/` exactly as requested: open the components, read and edit the real generated React/JSX, copy structure into your own project, or run a read/edit pass with an AI assistant:

```bash
npm run view-source   # Vite serves src/ for browsing (files won't render, but are navigable/editable)
```

## What was NOT recreated

Nothing here is a hand-written recreation. The `offline/index.html` is the live site's SSR HTML. The `src/*.jsx` are the de-bundled originals. The only transformations applied were:
- asset/bundle URLs in `offline/index.html` rewritten to local paths;
- import specifiers in `src/*.jsx` rewritten from `https://…` / `#framer/local/…` to local relative `.jsx` paths.

## Tools used (the workflow you described)

1. **Source-map extraction** (your "Buscar los Source Maps" step) — Framer shipped `.mjs.map`; `sourcesContent` had the originals. `.recover/crawl.mjs` downloaded every bundle + map and pulled readable modules.
2. **De-bundling** — the maps already split the bundle back into individual modules (no `webcrack` needed).
3. **AI-assisted naming** — semantic component names recovered from the default-import bindings across the source (`Navbar`, `FAQ`, `BlogCard`, …). See `.recover/analysis.json`.
4. **Exact offline** — `offline_build.mjs` localized HTML/CSS/images/fonts/videos.

The `.recover/` folder contains the crawler and intermediate working files for full transparency and re-runnability.