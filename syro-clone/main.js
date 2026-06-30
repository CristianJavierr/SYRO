const initLenis = () => {
  if (window.lenis) {
    window.lenis.resize?.();
    window.lenis.start?.();
    return window.lenis;
  }

  if (typeof window.Lenis === "undefined") {
    console.warn("Lenis no está cargado; smooth scroll desactivado");
    return null;
  }

  const lenis = new window.Lenis({
    lerp: 0.09,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    autoResize: true,
  });

  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!hasGSAP) {
    console.warn("GSAP/ScrollTrigger no está cargado; smooth scroll desactivado");
    return null;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  // scrollerProxy tells ScrollTrigger to use Lenis's interpolated scroll
  // position (lenis.actualScroll) instead of window.scrollY. This is
  // critical because window.scrollTo() is async — the browser doesn't
  // update window.scrollY until the next frame, so ScrollTrigger would
  // always read a stale value during smooth scroll interpolation.
  // With scrollerProxy, ScrollTrigger reads lenis.actualScroll which is
  // updated synchronously by lenis.raf() in the same frame.
  // Reference: https://github.com/darkroomengineering/lenis#gsap-scrolltrigger
  window.ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.actualScroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  window.gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
    window.ScrollTrigger.update();
  });

  window.gsap.ticker.lagSmoothing(0);

  window.lenis = lenis;
  lenis.resize?.();
  lenis.start?.();
  console.log("Lenis + GSAP ScrollTrigger inicializado");
  return lenis;
};

document.addEventListener("DOMContentLoaded", () => {
  const createScrollReveal = ({
    trigger,
    endTrigger,
    onEnter,
    onHide,
    start = "top bottom+=60",
    end = "bottom top",
  }) => {
    let isVisible = false;
    const show = () => {
      if (isVisible) return;
      isVisible = true;
      onEnter();
    };
    const hide = () => {
      if (!isVisible) return;
      isVisible = false;
      onHide();
    };

    isVisible = true;
    hide();

    // One active range: entering reveals, leaving either side hides.
    // Using the same start boundary for enter and leaveBack avoids the dead band
    // caused by separate "top bottom+=60" and "top bottom" triggers.
    window.ScrollTrigger.create({
      trigger,
      endTrigger: endTrigger || trigger,
      start,
      end,
      onEnter: show,
      onEnterBack: show,
      onLeave: hide,
      onLeaveBack: hide,
      invalidateOnRefresh: true,
    });

    window.requestAnimationFrame(() => {
      if (window.ScrollTrigger.isInViewport?.(trigger, 0)) {
        show();
      }
    });
  };

  const initIntegrationsDescriptionAnimation = () => {
    const description = document.querySelector(".integrations-description");
    const masks = window.gsap?.utils?.toArray(".integrations-description-line-mask") ?? [];
    const lines = window.gsap?.utils?.toArray(".integrations-description-line") ?? [];
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!description || !masks.length || !lines.length || !hasGSAP) return;

    window.gsap.registerPlugin(window.ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.gsap.set([description, ...masks, ...lines], { y: 0, yPercent: 0, opacity: 1 });
      return;
    }

    const targets = [description, ...masks, ...lines];

    const setHidden = () => {
      window.gsap.killTweensOf(targets);
      window.gsap.set(description, { opacity: 0 });
      window.gsap.set(masks, { y: 34 });
      window.gsap.set(lines, { yPercent: 110 });
    };

    const playIn = () => {
      window.gsap.killTweensOf(targets);
      window.gsap.set(description, { opacity: 0 });
      window.gsap.set(masks, { y: 34 });
      window.gsap.set(lines, { yPercent: 110 });
      window.gsap.timeline()
        .to(description, { opacity: 1, duration: 1.14, ease: "power3.out" }, 0)
        .to(masks, { y: 0, duration: 1.14, ease: "power3.out", overwrite: true }, 0)
        .to(lines, { yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.16, overwrite: true }, 0.08);
    };

    createScrollReveal({ trigger: description, onEnter: playIn, onHide: setHidden, start: "top bottom", end: "bottom top" });
  };

  const initProductsDescriptionAnimation = () => {
    const description = document.querySelector(".case-studies-intro__description");
    const masks = window.gsap?.utils?.toArray(".products-description-line-mask") ?? [];
    const lines = window.gsap?.utils?.toArray(".products-description-line") ?? [];
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!description || !masks.length || !lines.length || !hasGSAP) return;

    window.gsap.registerPlugin(window.ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.gsap.set([description, ...masks, ...lines], { y: 0, yPercent: 0, opacity: 1 });
      return;
    }

    const targets = [description, ...masks, ...lines];

    const setHidden = () => {
      window.gsap.killTweensOf(targets);
      window.gsap.set(description, { opacity: 0 });
      window.gsap.set(masks, { y: 34 });
      window.gsap.set(lines, { yPercent: 110 });
    };

    const playIn = () => {
      window.gsap.killTweensOf(targets);
      window.gsap.set(description, { opacity: 0 });
      window.gsap.set(masks, { y: 34 });
      window.gsap.set(lines, { yPercent: 110 });
      window.gsap.timeline()
        .to(description, { opacity: 1, duration: 0.95, ease: "power3.out" }, 0)
        .to(masks, { y: 0, duration: 0.95, ease: "power3.out", overwrite: true }, 0)
        .to(lines, { yPercent: 0, duration: 0.86, ease: "power3.out", stagger: 0.12, overwrite: true }, 0.08);
    };

    createScrollReveal({ trigger: description, onEnter: playIn, onHide: setHidden, start: "top bottom", end: "bottom top" });
  };

  const splitHeroTitle = () => {
    const title = document.querySelector(".hero-copy h1");

    if (!title || title.dataset.split === "true") {
      return;
    }

    const text = title.textContent;
    title.textContent = "";
    title.dataset.split = "true";

    [...text].forEach((char, index) => {
      const mask = document.createElement("span");
      const letter = document.createElement("span");

      mask.className = "hero-title-char-mask";
      letter.className = "hero-title-char";
      letter.textContent = char === " " ? "\u00a0" : char;
      letter.style.transitionDelay = `${index * 0.02}s`;

      mask.appendChild(letter);
      title.appendChild(mask);
    });
  };

  const splitTitleIntoChars = (title) => {
    if (!title || title.dataset.split === "true") {
      return;
    }

    const text = title.textContent.trim();
    title.textContent = "";
    title.dataset.split = "true";
    title.setAttribute("aria-label", text);

    text.split(/\s+/).forEach((word, wordIndex, words) => {
      const wordEl = document.createElement("span");
      wordEl.className = "products-title-word";
      wordEl.setAttribute("aria-hidden", "true");

      [...word].forEach((char) => {
        const charEl = document.createElement("span");
        charEl.className = "products-title-char";
        charEl.textContent = char;
        wordEl.appendChild(charEl);
      });

      title.appendChild(wordEl);

      if (wordIndex < words.length - 1) {
        title.appendChild(document.createTextNode(" "));
      }
    });

    title.style.opacity = "1";
  };

  const splitProductsTitle = () => {
    const title = document.querySelector(".case-studies-intro__title");
    splitTitleIntoChars(title);
  };

  const initProductsTitleAnimation = () => {
    const title = document.querySelector(".case-studies-intro__title");
    const section = document.querySelector(".case-studies-intro");
    const chars = title ? window.gsap?.utils?.toArray(title.querySelectorAll(".products-title-char")) : [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!title || !section || !chars.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    if (reduceMotion) {
      window.gsap.set(chars, { y: "0em", rotate: 0 });
      return;
    }

    const setHidden = () => {
      window.gsap.killTweensOf(chars);
      window.gsap.set(chars, {
        y: "100%",
        rotate: 0,
        transformOrigin: "50% 100%",
      });
    };

    const playIn = () => {
      window.gsap.killTweensOf(chars);
      window.gsap.set(chars, {
        y: "1.3em",
        rotate: 10,
        transformOrigin: "50% 100%",
      });
      window.gsap.to(chars, {
        y: "0em",
        rotate: 0,
        duration: 0.67,
        ease: "power3.out",
        stagger: 0.033,
        overwrite: true,
      });
    };

    createScrollReveal({
      trigger: title,
      onEnter: playIn,
      onHide: setHidden,
      start: "top bottom",
      end: "bottom top",
    });
  };

  const splitTextIntoLines = (element, options) => {
    if (!element || element.dataset.split === "true") {
      return;
    }

    const text = element.textContent.trim();
    const words = text.split(/\s+/);
    element.textContent = "";
    element.dataset.split = "measuring";
    element.setAttribute("aria-label", text);

    const measuringWords = words.map((word, index) => {
      const wordEl = document.createElement("span");
      wordEl.className = options.measureClass;
      wordEl.textContent = index < words.length - 1 ? `${word} ` : word;
      element.appendChild(wordEl);
      return wordEl;
    });

    const lines = [];

    measuringWords.forEach((wordEl) => {
      const top = Math.round(wordEl.offsetTop);
      const currentLine = lines[lines.length - 1];

      if (!currentLine || currentLine.top !== top) {
        lines.push({ top, text: wordEl.textContent });
      } else {
        currentLine.text += wordEl.textContent;
      }
    });

    element.textContent = "";
    element.dataset.split = "true";

    lines.forEach((line) => {
      const mask = document.createElement("span");
      const lineEl = document.createElement("span");

      mask.className = options.maskClass;
      mask.setAttribute("aria-hidden", "true");
      lineEl.className = options.lineClass;
      lineEl.textContent = line.text.trimEnd();

      mask.appendChild(lineEl);
      element.appendChild(mask);
    });
  };

  const splitProductsDescription = () => {
    splitTextIntoLines(document.querySelector(".case-studies-intro__description"), {
      measureClass: "products-description-measure-word",
      maskClass: "products-description-line-mask",
      lineClass: "products-description-line",
    });
  };

  const splitIntegrationsDescription = () => {
    splitTextIntoLines(document.querySelector(".integrations-description"), {
      measureClass: "integrations-description-measure-word",
      maskClass: "integrations-description-line-mask",
      lineClass: "integrations-description-line",
    });
  };




  const splitServicesDescriptions = () => {
    document.querySelectorAll(".service-title").forEach((title) => {
      splitTitleIntoChars(title);
    });

    document.querySelectorAll(".service-desc").forEach((description) => {
      splitTextIntoLines(description, {
        measureClass: "service-desc-measure-word",
        maskClass: "service-desc-line-mask",
        lineClass: "service-desc-line",
      });
    });
  };

  const initServicesDescriptionsAnimation = () => {
    const section = document.querySelector(".services");
    const cards = Array.from(document.querySelectorAll(".service-card"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!section || !cards.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    const cardData = cards.map((card) => {
      const title = card.querySelector(".service-title");
      const desc = card.querySelector(".service-desc");
      const content = card.querySelector(".service-content");
      const illustration = card.querySelector(".service-illustration");
      const paths = window.gsap.utils.toArray(card.querySelectorAll(".illustration-container path"));
      const titleChars = title ? window.gsap.utils.toArray(title.querySelectorAll(".products-title-char")) : [];
      const descMasks = desc ? window.gsap.utils.toArray(desc.querySelectorAll(".service-desc-line-mask")) : [];
      const descLines = desc ? window.gsap.utils.toArray(desc.querySelectorAll(".service-desc-line")) : [];

      return { title, desc, content, illustration, paths, titleChars, descMasks, descLines };
    });

    const hasElements = cardData.some(c => c.titleChars.length || c.descLines.length || c.paths.length);
    if (!hasElements) return;

    if (reduceMotion) {
      cardData.forEach(c => {
        if (c.title) window.gsap.set(c.title, { opacity: 1 });
        if (c.titleChars.length) window.gsap.set(c.titleChars, { y: "0em", rotate: 0 });
        if (c.descLines.length) window.gsap.set([c.desc, ...c.descMasks, ...c.descLines], { y: 0, yPercent: 0, opacity: 1 });
        if (c.paths.length) window.gsap.set(c.paths, { opacity: 1, strokeDashoffset: 0 });
      });
      return;
    }

    const setTextHidden = (c) => {
      c.textTimeline?.kill();
      if (c.titleChars.length) {
        window.gsap.killTweensOf([c.title, ...c.titleChars]);
        window.gsap.set(c.title, { opacity: 0 });
        window.gsap.set(c.titleChars, {
          y: "100%",
          rotate: 0,
          transformOrigin: "50% 100%",
        });
      }
      if (c.descLines.length) {
        window.gsap.killTweensOf([c.desc, ...c.descMasks, ...c.descLines]);
        window.gsap.set(c.desc, { opacity: 0 });
        window.gsap.set(c.descMasks, { y: 24 });
        window.gsap.set(c.descLines, { yPercent: 110 });
      }
    };

    const shouldReplaySvg = () => window.matchMedia("(max-width: 767px)").matches;

    const setSvgHidden = (c) => {
      c.svgDelayCall?.kill();
      c.svgDelayCall = null;
      if (shouldReplaySvg()) {
        c.hasDrawnSvg = false;
      }
      if ((!c.hasDrawnSvg || shouldReplaySvg()) && c.illustration) {
        c.illustration.classList.remove("is-drawing");
      }
    };

    const setHidden = () => {
      cardData.forEach((c) => {
        setTextHidden(c);
        setSvgHidden(c);
      });
    };

    const setTextReady = (c) => {
      c.textTimeline?.kill();
      if (c.titleChars.length) {
        window.gsap.killTweensOf([c.title, ...c.titleChars]);
        window.gsap.set(c.title, { opacity: 0 });
        window.gsap.set(c.titleChars, {
          y: "1.3em",
          rotate: 10,
          transformOrigin: "50% 100%",
        });
      }
      if (c.descLines.length) {
        window.gsap.killTweensOf([c.desc, ...c.descMasks, ...c.descLines]);
        window.gsap.set(c.desc, { opacity: 0 });
        window.gsap.set(c.descMasks, { y: 24 });
        window.gsap.set(c.descLines, { yPercent: 110 });
      }
    };

    const animateSvg = (c, delay = 0) => {
      if (!c.illustration || !c.paths.length || (!shouldReplaySvg() && c.hasDrawnSvg)) return;
      setSvgHidden(c);

      c.svgDelayCall = window.gsap.delayedCall(delay, () => {
        c.hasDrawnSvg = true;
        c.svgDelayCall = null;
        c.illustration.classList.remove("is-drawing");
        c.illustration.offsetWidth;
        c.illustration.classList.add("is-drawing");
      });
    };

    const animateText = (c, delay = 0) => {
      setTextReady(c);
      const tl = window.gsap.timeline({ delay });
      c.textTimeline = tl;

      if (c.titleChars.length) {
        tl.to(c.title, {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
          overwrite: true,
        }, 0.08)
        .to(c.titleChars, {
          y: "0em",
          rotate: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.02,
          overwrite: true,
        }, 0.08);
      }

      if (c.descLines.length) {
        tl.to(c.desc, {
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        }, 0.15)
        .to(c.descMasks, {
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: true,
        }, 0.15)
        .to(c.descLines, {
          yPercent: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.06,
          overwrite: true,
        }, 0.20);
      }
    };

    setHidden();

    const desktopSeries = window.matchMedia("(min-width: 768px)");

    cardData.forEach((c, index) => {
      const delay = desktopSeries.matches ? index * 0.16 : 0;
      const textTrigger = c.content || c.desc || c.title || section;
      const svgTrigger = c.illustration || section;

      createScrollReveal({
        trigger: textTrigger,
        endTrigger: textTrigger,
        onEnter: () => animateText(c, delay),
        onHide: () => setTextHidden(c),
        start: "top bottom",
        end: "bottom top",
      });

      createScrollReveal({
        trigger: svgTrigger,
        endTrigger: svgTrigger,
        onEnter: () => animateSvg(c),
        onHide: () => setSvgHidden(c),
        start: "top bottom",
        end: "bottom top",
      });
    });
  };

  const splitCaseStudyDescriptions = () => {
    document.querySelectorAll(".case-study__description").forEach((description) => {
      splitTextIntoLines(description, {
        measureClass: "case-study-description-measure-word",
        maskClass: "case-study-description-line-mask",
        lineClass: "case-study-description-line",
      });
    });
  };

  const initCaseStudyDescriptionAnimations = () => {
    const cards = window.gsap?.utils?.toArray(".case-study") ?? [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!cards.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    cards.forEach((card) => {
      const description = card.querySelector(".case-study__description");
      const masks = window.gsap.utils.toArray(card.querySelectorAll(".case-study-description-line-mask"));
      const lines = window.gsap.utils.toArray(card.querySelectorAll(".case-study-description-line"));

      if (!description || !masks.length || !lines.length) {
        return;
      }

      if (reduceMotion) {
        window.gsap.set([description, ...masks, ...lines], { y: 0, yPercent: 0, opacity: 1 });
        return;
      }

      const targets = [description, ...masks, ...lines];

      const setHidden = () => {
        window.gsap.killTweensOf(targets);
        window.gsap.set(description, { opacity: 0 });
        window.gsap.set(masks, { y: 24 });
        window.gsap.set(lines, { yPercent: 110 });
      };

      const playIn = () => {
        window.gsap.killTweensOf(targets);
        window.gsap.set(description, { opacity: 0 });
        window.gsap.set(masks, { y: 24 });
        window.gsap.set(lines, { yPercent: 110 });

        window.gsap.timeline()
          .to(description, {
            opacity: 1,
            duration: 0.82,
            ease: "power3.out",
          }, 0)
          .to(masks, {
            y: 0,
            duration: 0.82,
            ease: "power3.out",
            overwrite: true,
          }, 0)
          .to(lines, {
            yPercent: 0,
            duration: 0.74,
            ease: "power3.out",
            stagger: 0.09,
            overwrite: true,
          }, 0.06);
      };

      setHidden();

      createScrollReveal({
        trigger: description,
        onEnter: playIn,
        onHide: setHidden,
        start: "top bottom",
        end: "bottom top",
      });
    });
  };

  const initCaseStudyLineDraw = () => {
    const rows = window.gsap?.utils?.toArray(".case-studies-list__items li") ?? [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!rows.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    if (reduceMotion) {
      window.gsap.set(rows, { "--case-line-scale": 1 });
      return;
    }

    rows.forEach((row) => {
      window.gsap.fromTo(row, {
        "--case-line-scale": 0,
      }, {
        "--case-line-scale": 1,
        ease: "none",
        scrollTrigger: {
          trigger: row,
          start: "top 112%",
          end: "top 72%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
  };

  const wrapCaseStudyLogos = () => {
    document.querySelectorAll(".case-study__logo").forEach((logo) => {
      if (logo.dataset.masked === "true") {
        return;
      }

      const mask = document.createElement("span");
      mask.className = "case-study-logo-mask";
      mask.setAttribute("aria-hidden", "true");
      logo.dataset.masked = "true";
      logo.parentNode.insertBefore(mask, logo);
      mask.appendChild(logo);
    });
  };

  const initCaseStudyLogoAnimations = () => {
    const cards = window.gsap?.utils?.toArray(".case-study") ?? [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!cards.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    cards.forEach((card) => {
      const mask = card.querySelector(".case-study-logo-mask");
      const logo = card.querySelector(".case-study__logo");

      if (!mask || !logo) {
        return;
      }

      if (reduceMotion) {
        window.gsap.set([mask, logo], { y: 0, yPercent: 0, opacity: 1 });
        return;
      }

      const targets = [mask, logo];

      const setHidden = () => {
        window.gsap.killTweensOf(targets);
        window.gsap.set(mask, { y: 0, opacity: 0 });
        window.gsap.set(logo, { yPercent: 112 });
      };

      const playIn = () => {
        window.gsap.killTweensOf(targets);
        window.gsap.set(mask, { y: 0, opacity: 0 });
        window.gsap.set(logo, { yPercent: 112 });

        window.gsap.timeline()
          .to(mask, {
            opacity: 1,
            duration: 0.82,
            ease: "power3.out",
          }, 0)
          .to(logo, {
            yPercent: 0,
            duration: 0.74,
            ease: "power3.out",
            overwrite: true,
          }, 0.06);
      };

      setHidden();

      createScrollReveal({
        trigger: mask,
        onEnter: playIn,
        onHide: setHidden,
        start: "top bottom",
        end: "bottom top",
      });
    });
  };

  const splitCaseStudyTitles = () => {
    document.querySelectorAll(".case-study__title").forEach((title) => {
      if (!title || title.dataset.split === "true") {
        return;
      }

      const text = title.textContent.trim();
      title.textContent = "";
      title.dataset.split = "true";
      title.setAttribute("aria-label", text);

      [...text].forEach((char) => {
        const charEl = document.createElement("span");
        const reel = document.createElement("span");
        const glyph = document.createElement("span");

        charEl.className = "syro-pos-title-char";
        charEl.setAttribute("aria-hidden", "true");
        charEl.dataset.finalChar = char === " " ? "\u00a0" : char;
        reel.className = "syro-pos-title-reel";
        glyph.className = "syro-pos-title-reel-glyph";
        glyph.textContent = char === " " ? "\u00a0" : char;
        reel.appendChild(glyph);
        charEl.appendChild(reel);
        title.appendChild(charEl);
        charEl.style.width = `${glyph.getBoundingClientRect().width}px`;
      });
    });
  };

  const initCaseStudyTitleAnimations = () => {
    const cards = window.gsap?.utils?.toArray(".case-study") ?? [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!cards.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    const slotChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|!@#$%&?+-";
    const reelLength = 9;
    const reelStep = 1.3;

    const randomSlotChar = () => slotChars[Math.floor(Math.random() * slotChars.length)];
    const buildReel = (char) => {
      const finalChar = char.dataset.finalChar;
      const reel = char.querySelector(".syro-pos-title-reel");

      if (!reel) {
        return null;
      }

      reel.textContent = "";

      if (finalChar === "\u00a0") {
        const glyph = document.createElement("span");
        glyph.className = "syro-pos-title-reel-glyph";
        glyph.textContent = "\u00a0";
        reel.appendChild(glyph);
        return reel;
      }

      for (let index = 0; index < reelLength; index += 1) {
        const glyph = document.createElement("span");
        glyph.className = "syro-pos-title-reel-glyph";
        glyph.textContent = index === 0 ? finalChar : randomSlotChar();
        reel.appendChild(glyph);
      }

      return reel;
    };

    cards.forEach((card) => {
      const chars = window.gsap.utils.toArray(card.querySelectorAll(".syro-pos-title-char"));
      const title = card.querySelector(".case-study__title");
      const center = (chars.length - 1) / 2;
      const maxDistance = Math.max(center, 1);
      let activeTweens = [];

      if (!title || !chars.length) {
        return;
      }

      if (reduceMotion) {
        chars.forEach((char) => {
          const reel = buildReel(char);
          window.gsap.set(reel, { y: "0em" });
        });
        return;
      }

      const setHidden = () => {
        activeTweens.forEach((tween) => tween.kill());
        activeTweens = [];
        chars.forEach((char) => {
          const reel = buildReel(char);
          const finalChar = char.dataset.finalChar;

          window.gsap.set(char, { y: "0em", rotate: 0 });

          if (reel) {
            window.gsap.set(reel, {
              y: finalChar === "\u00a0" ? "0em" : `${-1 * (reelLength - 1) * reelStep}em`,
            });
          }
        });
      };

      const playIn = () => {
        activeTweens.forEach((tween) => tween.kill());
        activeTweens = [];
        window.gsap.killTweensOf(chars);

        chars.forEach((char, index) => {
          const finalChar = char.dataset.finalChar;
          const reel = buildReel(char);

          if (finalChar === "\u00a0" || !reel) {
            return;
          }

          const distanceFromCenter = Math.abs(index - center) / maxDistance;
          const duration = window.gsap.utils.interpolate(0.54, 1.24, distanceFromCenter);

          window.gsap.set(reel, {
            y: `${-1 * (reelLength - 1) * reelStep}em`,
            rotate: 0,
            transformOrigin: "50% 100%",
          });

          const tween = window.gsap.to(reel, {
            y: "0em",
            duration,
            ease: "power4.out",
            overwrite: true,
          });

          activeTweens.push(tween);
        });
      };

      setHidden();

      createScrollReveal({
        trigger: title,
        onEnter: playIn,
        onHide: setHidden,
        start: "top bottom",
        end: "bottom top",
      });
    });
  };

  const initCaseStudyYearScramble = () => {
    const years = window.gsap?.utils?.toArray(".case-study__year p") ?? [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
    const scrambleChars = "/0123456789@#$%&?+";

    if (!years.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
    const scrambleText = (text, visibleCount = 0) => [...text]
      .map((char, index) => {
        if (char === " ") {
          return " ";
        }

        return index < visibleCount ? char : randomChar();
      })
      .join("");

    years.forEach((year) => {
      const text = year.textContent.trim();
      let activeTween;

      if (!text) {
        return;
      }

      year.dataset.scrambleText = text;
      year.setAttribute("aria-label", text);

      if (reduceMotion) {
        year.textContent = text;
        return;
      }

      const setHidden = () => {
        year.textContent = scrambleText(text, 0);
      };

      const playIn = () => {
        const state = { progress: 0 };

        activeTween?.kill();
        window.gsap.killTweensOf(year);
        setHidden();

        activeTween = window.gsap.to(state, {
          progress: text.length,
          duration: 0.72,
          ease: "none",
          overwrite: true,
          onUpdate: () => {
            year.textContent = scrambleText(text, Math.floor(state.progress));
          },
          onComplete: () => {
            year.textContent = text;
          },
        });
      };

      setHidden();

      createScrollReveal({
        trigger: year,
        onEnter: playIn,
        onHide: setHidden,
        start: "top bottom",
        end: "bottom top",
      });
    });
  };

  const runEntryAnimation = (onComplete) => {
    const loader = document.querySelector(".entry-loader");
    const progressBar = document.querySelector(".entry-progress-bar");
    const progressFill = document.querySelector(".entry-progress-bar__fill");
    const heroVideo = document.querySelector(".hero-video");
    const heroVideoMedia = document.querySelector(".hero-video video");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!loader || !progressBar || !progressFill || !heroVideo || !heroVideoMedia) {
      document.body.classList.remove("is-loading");
      onComplete?.();
      return;
    }

    if (reduceMotion) {
      progressBar.style.transform = "scaleX(1)";
      progressFill.style.transform = "scaleX(1)";
      heroVideo.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
      heroVideoMedia.style.transform = "translate(-50%, -50%) scale(1)";
      document.body.classList.add("entry-open");
      window.setTimeout(() => {
        document.body.classList.remove("is-loading", "entry-window", "entry-open");
        loader.remove();
        onComplete?.();
      }, 120);
      return;
    }

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const start = performance.now();
    const countDuration = 600;
    const hop = "cubic-bezier(0.9, 0, 0.1, 1)";

    heroVideo.style.clipPath = "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)";
    heroVideoMedia.style.transform = "translate(-50%, -50%) scale(2)";

    const tick = (now) => {
      const progress = Math.min((now - start) / countDuration, 1);
      const eased = easeOutCubic(progress);
      progressBar.style.transform = `scaleX(${eased})`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);

    window.setTimeout(() => {
      document.body.classList.add("entry-window");
      heroVideo.animate(
        [
          { clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)" },
          { clipPath: "polygon(35% 35%, 65% 35%, 65% 65%, 35% 65%)" },
        ],
        {
          duration: 1200,
          easing: hop,
          fill: "forwards",
        }
      );
      heroVideoMedia.animate(
        [
          { transform: "translate(-50%, -50%) scale(2)" },
          { transform: "translate(-50%, -50%) scale(1.5)" },
        ],
        {
          duration: 1200,
          easing: hop,
          fill: "forwards",
        }
      );
    }, 0);

    window.setTimeout(() => {
      document.body.classList.add("entry-open");
      heroVideo.animate(
        [
          { clipPath: "polygon(35% 35%, 65% 35%, 65% 65%, 35% 65%)" },
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
        ],
        {
          duration: 1600,
          easing: hop,
          fill: "forwards",
        }
      );
      heroVideoMedia.animate(
        [
          { transform: "translate(-50%, -50%) scale(1.5)" },
          { transform: "translate(-50%, -50%) scale(1)" },
        ],
        {
          duration: 1600,
          easing: hop,
          fill: "forwards",
        }
      );
      progressFill.style.transition = "transform 1.6s cubic-bezier(0.9, 0, 0.1, 1)";
      progressFill.style.transform = "scaleX(1)";
    }, 1200);

    window.setTimeout(() => {
      progressBar.style.transition = "opacity 0.5s ease";
      progressBar.style.opacity = "0";
    }, 2800);

    window.setTimeout(() => {
      heroVideo.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
      heroVideoMedia.style.transform = "translate(-50%, -50%) scale(1)";
      document.body.classList.remove("is-loading", "entry-window", "entry-open");
      loader.remove();
      onComplete?.();
    }, 2900);
  };

  splitHeroTitle();
  splitProductsTitle();
  splitCaseStudyTitles();
  wrapCaseStudyLogos();
  runEntryAnimation(() => {
    const lenis = initLenis();
    initProductsTitleAnimation();
    initCaseStudyTitleAnimations();
    initCaseStudyLogoAnimations();
    initCaseStudyYearScramble();
    initCaseStudyLineDraw();
    const splitProductFeaturesTitle = () => {
    const title = document.querySelector(".product-features-intro__title");
    splitTitleIntoChars(title);
  };

  const initProductFeaturesTitleAnimation = () => {
    const title = document.querySelector(".product-features-intro__title");
    const section = document.querySelector(".product-features-intro");
    const chars = title ? window.gsap?.utils?.toArray(title.querySelectorAll(".products-title-char")) : [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!title || !section || !chars.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    if (reduceMotion) {
      window.gsap.set(chars, { y: "0em", rotate: 0 });
      return;
    }

    const setHidden = () => {
      window.gsap.killTweensOf(chars);
      window.gsap.set(chars, {
        y: "100%",
        rotate: 0,
        transformOrigin: "50% 100%",
      });
    };

    const playIn = () => {
      window.gsap.killTweensOf(chars);
      window.gsap.set(chars, {
        y: "1.3em",
        rotate: 10,
        transformOrigin: "50% 100%",
      });
      window.gsap.to(chars, {
        y: "0em",
        rotate: 0,
        duration: 0.67,
        ease: "power3.out",
        stagger: 0.033,
        overwrite: true,
      });
    };

    createScrollReveal({
      trigger: title,
      onEnter: playIn,
      onHide: setHidden,
      start: "top bottom",
      end: "bottom top",
    });
  };

  const splitHeroServices = () => {
    document.querySelectorAll(".hero-services p").forEach((p) => {
      splitTextIntoLines(p, {
        measureClass: "hero-services-measure-word",
        maskClass: "hero-services-line-mask",
        lineClass: "hero-services-line",
      });
    });
  };

  const initHeroServicesAnimation = () => {
    const paragraphs = Array.from(document.querySelectorAll(".hero-services p"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined";

    if (!paragraphs.length || !hasGSAP) {
      return;
    }

    const lines = paragraphs.map((p) => p.querySelector(".hero-services-line")).filter(Boolean);

    if (reduceMotion) {
      window.gsap.set(paragraphs, { opacity: 1 });
      window.gsap.set(lines, { yPercent: 0 });
      return;
    }

    window.gsap.set(paragraphs, { opacity: 0 });
    window.gsap.set(lines, { yPercent: 110 });

    const tl = window.gsap.timeline();

    paragraphs.forEach((p, idx) => {
      const line = lines[idx];
      if (!line) return;

      const startTime = idx * 0.16;

      tl.to(p, {
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
      }, startTime)
      .to(line, {
        yPercent: 0,
        duration: 0.65,
        ease: "power3.out",
        overwrite: true,
      }, startTime + 0.05);
    });
  };

  const initPreviewFollower = () => {
    const wrappers = document.querySelectorAll('[data-follower-wrap]');

    wrappers.forEach(wrap => {
      const collection = wrap.querySelector('[data-follower-collection]');
      const items = wrap.querySelectorAll('[data-follower-item]');
      const follower = wrap.querySelector('[data-follower-cursor]');
      const followerInner = wrap.querySelector('[data-follower-cursor-inner]');

      if (!collection || !follower || !followerInner) return;

      // Dynamically initialize dual image structure for transitions
      followerInner.innerHTML = `
        <img class="marcas-img marcas-img--prev" src="" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0;" />
        <img class="marcas-img marcas-img--current" src="" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; clip-path: inset(0% 0% 100% 0%); transform: scale(1.3); z-index: 2;" />
      `;

      const prevImg = followerInner.querySelector('.marcas-img--prev');
      const currentImg = followerInner.querySelector('.marcas-img--current');

      window.gsap.set(follower, { xPercent: -50, yPercent: -50 });
      const xTo = window.gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = window.gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });

      window.addEventListener('mousemove', e => {
        xTo(e.clientX);
        yTo(e.clientY);
      });

      let activeIndex = null;
      let prevSrc = null;
      let isFirst = true;

      items.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
          if (index === activeIndex) return;

          const visual = item.querySelector('[data-follower-visual]');
          const newSrc = visual ? visual.getAttribute('src') : '';
          if (!newSrc) return;

          // Determine animation reveal direction based on mouse vertical movement direction
          let startClip = 'inset(0% 0% 100% 0%)'; // default
          if (activeIndex !== null) {
            const isMovingDown = index > activeIndex;
            if (isMovingDown) {
              startClip = 'inset(100% 0% 0% 0%)'; // bottom-to-top reveal when moving DOWN
            } else {
              startClip = 'inset(0% 0% 100% 0%)'; // top-to-bottom reveal when moving UP
            }
          }

          activeIndex = index;

          window.gsap.killTweensOf([currentImg, prevImg]);

          if (isFirst) {
            isFirst = false;
            window.gsap.set(prevImg, { opacity: 0, zIndex: 1 });
            window.gsap.set(currentImg, {
              clipPath: startClip,
              scale: 1.3,
              zIndex: 2,
            });

            currentImg.src = newSrc;

            const tl = window.gsap.timeline();
            tl.to(currentImg, {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.45,
              ease: 'power2.out',
            })
            .to(currentImg, {
              scale: 1,
              duration: 0.7,
              ease: 'power2.out',
            }, 0);
          } else {
            if (prevSrc) {
              prevImg.src = prevSrc;
            }
            window.gsap.set(prevImg, {
              clipPath: 'inset(0% 0% 0% 0%)',
              scale: 1,
              opacity: 1,
              zIndex: 1,
            });

            currentImg.src = newSrc;
            window.gsap.set(currentImg, {
              clipPath: startClip,
              scale: 1.3,
              zIndex: 2,
            });

            const tl = window.gsap.timeline();
            tl.to(currentImg, {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.45,
              ease: 'power2.out',
            })
            .to(currentImg, {
              scale: 1,
              duration: 0.7,
              ease: 'power2.out',
            }, 0);
          }

          prevSrc = newSrc;
        });
      });

      collection.addEventListener('mouseleave', () => {
        window.gsap.killTweensOf([currentImg, prevImg]);
        activeIndex = null;

        window.gsap.to(currentImg, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.3,
          ease: 'power3.in',
          onComplete: () => {
            isFirst = true;
          },
        });
      });
    });
  };

  const splitPlatformIntegrationsTitle = () => {
    const title = document.querySelector(".platform-integrations__title");
    if (title) splitTitleIntoChars(title);
  };

  const initPlatformIntegrationsTitleAnimation = () => {
    const title = document.querySelector(".platform-integrations__title");
    const section = document.querySelector(".platform-integrations");
    const chars = title ? window.gsap?.utils?.toArray(title.querySelectorAll(".products-title-char")) : [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!title || !section || !chars.length || !hasGSAP) {
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    if (reduceMotion) {
      window.gsap.set(chars, { y: "0em", rotate: 0 });
      return;
    }

    const setHidden = () => {
      window.gsap.killTweensOf(chars);
      window.gsap.set(chars, {
        y: "100%",
        rotate: 0,
        transformOrigin: "50% 100%",
      });
    };

    const playIn = () => {
      window.gsap.killTweensOf(chars);
      window.gsap.set(chars, {
        y: "1.3em",
        rotate: 10,
        transformOrigin: "50% 100%",
      });
      window.gsap.to(chars, {
        y: "0em",
        rotate: 0,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.012,
        overwrite: true,
      });
    };

    createScrollReveal({
      trigger: title,
      onEnter: playIn,
      onHide: setHidden,
      start: "top bottom",
      end: "bottom top",
    });
  };

  const initPlatformIntegrationLogoAnimations = () => {
    const allLogos = window.gsap?.utils?.toArray(".platform-integration-logo") ?? [];
    const logos = allLogos.slice(0, 3);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!allLogos.length || !hasGSAP) return;

    window.gsap.registerPlugin(window.ScrollTrigger);
    allLogos.slice(3).forEach((logo) => {
      const img = logo.querySelector("img");
      logo.setAttribute("aria-hidden", "true");
      if (img) window.gsap.set(img, { opacity: 0, yPercent: 0, scale: 1 });
    });

    logos.forEach((logo, index) => {
      const img = logo.querySelector("img");

      if (!img) return;

      if (reduceMotion) {
        window.gsap.set(img, { opacity: 1, yPercent: 0, scale: 1 });
        return;
      }

      const setHidden = () => {
        window.gsap.killTweensOf(img);
        window.gsap.set(img, { opacity: 0, yPercent: 34, scale: 0.94 });
      };

      const playIn = () => {
        const delay = window.matchMedia("(min-width: 768px)").matches ? (index % 4) * 0.045 : 0;

        window.gsap.killTweensOf(img);
        window.gsap.set(img, { opacity: 0, yPercent: 34, scale: 0.94 });
        window.gsap.to(img, {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          duration: 0.72,
          delay,
          ease: "power3.out",
          overwrite: true,
        });
      };

      setHidden();

      createScrollReveal({
        trigger: logo,
        onEnter: playIn,
        onHide: setHidden,
        start: "top bottom",
        end: "bottom top",
      });
    });
  };

  const splitProductFeaturesDescription = () => {
    const desc = document.querySelector(".product-features-intro__description");
    if (desc) {
      splitTextIntoLines(desc, {
        measureClass: "product-features-description-measure-word",
        maskClass: "product-features-description-line-mask",
        lineClass: "product-features-description-line",
      });
    }
  };

  const initProductFeaturesDescriptionAnimation = () => {
    const description = document.querySelector(".product-features-intro__description");
    const masks = window.gsap?.utils?.toArray(".product-features-description-line-mask") ?? [];
    const lines = window.gsap?.utils?.toArray(".product-features-description-line") ?? [];
    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (!description || !masks.length || !lines.length || !hasGSAP) return;

    window.gsap.registerPlugin(window.ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.gsap.set([description, ...masks, ...lines], { y: 0, yPercent: 0, opacity: 1 });
      return;
    }

    const targets = [description, ...masks, ...lines];

    const setHidden = () => {
      window.gsap.killTweensOf(targets);
      window.gsap.set(description, { opacity: 0 });
      window.gsap.set(masks, { y: 34 });
      window.gsap.set(lines, { yPercent: 110 });
    };

    const playIn = () => {
      window.gsap.killTweensOf(targets);
      window.gsap.set(description, { opacity: 0 });
      window.gsap.set(masks, { y: 34 });
      window.gsap.set(lines, { yPercent: 110 });

      window.gsap.timeline()
        .to(description, { opacity: 1, duration: 0.95, ease: "power3.out" }, 0)
        .to(masks, { y: 0, duration: 0.95, ease: "power3.out", overwrite: true }, 0)
        .to(lines, { yPercent: 0, duration: 0.86, ease: "power3.out", stagger: 0.12, overwrite: true }, 0.08);
    };

    createScrollReveal({ trigger: description, onEnter: playIn, onHide: setHidden, start: "top bottom", end: "bottom top" });
  };

  const initDescription = () => {
      splitIntegrationsDescription();
      splitProductsDescription();
      splitCaseStudyDescriptions();
      splitServicesDescriptions();
      splitProductFeaturesTitle();
      splitHeroServices();
      splitPlatformIntegrationsTitle();
      splitProductFeaturesDescription();
      initIntegrationsDescriptionAnimation();
      initProductsDescriptionAnimation();
      initCaseStudyDescriptionAnimations();
      initServicesDescriptionsAnimation();
      initProductFeaturesTitleAnimation();
      initHeroServicesAnimation();
      initPlatformIntegrationsTitleAnimation();
      initPlatformIntegrationLogoAnimations();
      initProductFeaturesDescriptionAnimation();
      initPreviewFollower();
      window.ScrollTrigger?.refresh();
      document.documentElement.classList.add("animations-ready");
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(initDescription);
    } else {
      initDescription();
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));

        if (!target || !lenis) {
          return;
        }

        event.preventDefault();
        lenis.scrollTo(target, { offset: -20 });
      });
    });
  });

  const revealElements = document.querySelectorAll(".scroll-reveal");

  revealElements.forEach((el) => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = "";

    const wordSpans = words.map((word) => {
      const span = document.createElement("span");
      span.className = "reveal-word";
      span.textContent = word + " ";
      el.appendChild(span);
      return span;
    });

    const totalWords = wordSpans.length;

    // Initial state: all words at 0.2 opacity (faded)
    window.gsap.set(wordSpans, { opacity: 0.2 });

    // Build a timeline that reveals each word sequentially based on scroll.
    // scrub links the playhead to scroll position, so the animation
    // automatically reverses when the user scrolls back up — no manual reset needed.
    const tl = window.gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        end: "top 30%",
        scrub: 0.5,
      },
    });

    wordSpans.forEach((span, idx) => {
      tl.to(
        span,
        {
          opacity: 1,
          duration: 1 / totalWords,
          ease: "none",
        },
        idx / totalWords
      );
    });
  });
});
