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
  const LEAD_SENT_COOKIE = 'gw_lead_sent';

  const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const hasCookie = (name) => document.cookie.split('; ').some((c) => c.startsWith(`${name}=`));

  const contactForm = document.getElementById('contact-form');
  const successPanel = document.getElementById('contact-form-success');

  const showSuccessPanel = () => {
    if (contactForm) contactForm.hidden = true;
    if (successPanel) successPanel.hidden = false;
  };

  if (contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const statusEl = document.getElementById('form-status');
    const methodSelect = document.getElementById('contact-method');
    const contactInput = document.getElementById('contact-value');
    const contactLabel = document.getElementById('contact-label');

    const contactMethodMeta = {
      email: { label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'you@company.ru' },
      telegram: { label: 'Telegram', type: 'text', autocomplete: 'off', placeholder: '@username' },
      phone: { label: 'Телефон', type: 'tel', autocomplete: 'tel', placeholder: '+7 999 000-00-00' },
    };

    const applyContactMethod = () => {
      if (!methodSelect || !contactInput) return;
      const meta = contactMethodMeta[methodSelect.value] || contactMethodMeta.email;
      contactInput.type = meta.type;
      contactInput.autocomplete = meta.autocomplete;
      contactInput.placeholder = meta.placeholder;
      if (contactLabel) contactLabel.textContent = meta.label;
    };
    applyContactMethod();
    if (methodSelect) methodSelect.addEventListener('change', applyContactMethod);

    // Already submitted on a previous visit — skip the form entirely.
    if (hasCookie(LEAD_SENT_COOKIE)) {
      showSuccessPanel();
    }

    const setStatus = (text, kind) => {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.remove('is-success', 'is-error');
      if (kind) statusEl.classList.add(kind);
    };

    const fallbackToMailto = (name, bodyLines) => {
      const mailto = `mailto:rewle@yandex.ru?subject=${encodeURIComponent('Демо Gateway — ' + name)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      window.location.href = mailto;
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = (data.get('name') || '').toString().trim();
      const contactMethod = (data.get('contactMethod') || '').toString().trim();
      const contact = (data.get('contact') || '').toString().trim();
      const website = (data.get('website') || '').toString().trim();

      const bodyLines = [
        `Имя: ${name}`,
        `${(contactMethodMeta[contactMethod] || contactMethodMeta.email).label}: ${contact}`,
      ];

      if (submitBtn) submitBtn.disabled = true;
      setStatus('Отправляем…', null);

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        const res = await fetch(LEADS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, contactMethod, contact, website }),
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (!res.ok) throw new Error(`leadbot responded ${res.status}`);

        setStatus('', null);
        setCookie(LEAD_SENT_COOKIE, '1', 365);
        showSuccessPanel();
      } catch {
        setStatus('Не получилось отправить напрямую — откроется черновик письма.', 'is-error');
        if (submitBtn) submitBtn.disabled = false;
        fallbackToMailto(name, bodyLines);
        return;
      }
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
