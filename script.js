(() => {
  const LEADS_ENDPOINT = 'https://leads.gatewayb2b.ru/submit';

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

  // Contact form: submit to leadbot; on any failure fall back to a mailto draft
  // so the channel survives even if the VPS is down.
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const statusEl = document.getElementById('form-status');

    const setStatus = (text, kind) => {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.remove('is-success', 'is-error');
      if (kind) statusEl.classList.add(kind);
    };

    const fallbackToMailto = (company, bodyLines) => {
      const mailto = `mailto:rewle@yandex.ru?subject=${encodeURIComponent('Демо Gateway — ' + company)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      window.location.href = mailto;
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = (data.get('name') || '').toString().trim();
      const company = (data.get('company') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();
      const website = (data.get('website') || '').toString().trim();

      const bodyLines = [
        `Имя: ${name}`,
        `Компания: ${company}`,
        `Email: ${email}`,
        phone ? `Телефон: ${phone}` : null,
        message ? `\n${message}` : null,
      ].filter(Boolean);

      if (submitBtn) submitBtn.disabled = true;
      setStatus('Отправляем…', null);

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        const res = await fetch(LEADS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, company, email, phone, message, website }),
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (!res.ok) throw new Error(`leadbot responded ${res.status}`);

        setStatus('Спасибо, вернёмся с датой демо.', 'is-success');
        contactForm.reset();
      } catch {
        setStatus('', null);
        if (submitBtn) submitBtn.disabled = false;
        fallbackToMailto(company, bodyLines);
        return;
      }

      if (submitBtn) submitBtn.disabled = false;
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
