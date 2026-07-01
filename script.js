(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Wrap redacted values in real/hash spans and swap after the bar sweeps over them.
  document.querySelectorAll('.v.redact').forEach((el) => {
    const real = el.textContent;
    const hash = el.dataset.hash || '';
    el.innerHTML = `<span class="real-text">${real}</span><span class="hash-text">${hash}…</span>`;

    if (prefersReducedMotion) {
      el.classList.add('is-hashed');
      return;
    }
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0.6;
    window.setTimeout(() => el.classList.add('is-hashed'), delay * 1000);
  });

  // Scroll reveal.
  const revealTargets = document.querySelectorAll(
    '.problem-grid, .solution-inner, .steps, .feature-grid, .compare-inner, .pricing, .contact-inner'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  // Pricing tabs.
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.pricing-grid[data-panel]');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const target = btn.dataset.tab;
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.panel !== target;
      });
    });
  });
})();
