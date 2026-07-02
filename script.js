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
    '.problem-grid, .solution-inner, .steps, .feature-grid, .stack-inner, .compare-inner, .pricing, .faq-inner, .contact-inner'
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

  // Contact form: compose a mailto with the filled fields, no backend involved.
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = (data.get('name') || '').toString().trim();
      const company = (data.get('company') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      const bodyLines = [
        `Имя: ${name}`,
        `Компания: ${company}`,
        `Email: ${email}`,
        phone ? `Телефон: ${phone}` : null,
        message ? `\n${message}` : null,
      ].filter(Boolean);

      const mailto = `mailto:rewle@yandex.ru?subject=${encodeURIComponent('Демо Gateway — ' + company)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      window.location.href = mailto;
    });
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
