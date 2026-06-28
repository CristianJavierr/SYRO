document.addEventListener("DOMContentLoaded", () => {
  const revealElements = document.querySelectorAll(".scroll-reveal");

  revealElements.forEach((el) => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = "";

    const wordSpans = words.map((word) => {
      const span = document.createElement("span");
      span.className = "reveal-word";
      span.textContent = word + " ";
      span.style.opacity = "0.2";
      span.style.transition = "opacity 0.2s ease, color 0.2s ease";
      el.appendChild(span);
      return span;
    });

    const handleScrollReveal = () => {
      const rect = el.getBoundingClientRect();
      const viewHeight = window.innerHeight;

      // Animation starts when the top of the element enters 85% of the viewport height
      // Animation ends when the top of the element reaches 30% of the viewport height
      const start = viewHeight * 0.85;
      const end = viewHeight * 0.3;

      let progress = (start - rect.top) / (start - end);
      progress = Math.max(0, Math.min(1, progress));

      const totalWords = wordSpans.length;

      wordSpans.forEach((span, idx) => {
        const threshold = idx / totalWords;
        if (progress > threshold) {
          // Linear progress for each individual word
          const wordProgress = (progress - threshold) * totalWords;
          const opacity = 0.2 + 0.8 * Math.min(1, wordProgress);
          span.style.opacity = opacity.toString();
        } else {
          span.style.opacity = "0.2";
        }
      });
    };

    window.addEventListener("scroll", handleScrollReveal);
    window.addEventListener("resize", handleScrollReveal);
    handleScrollReveal(); // Run once initially
  });
});
