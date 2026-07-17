(() => {
  const toggle = document.querySelector('[data-lanyard-toggle]');
  if (!toggle) return;

  let mounted = false;
  let pending = null;

  toggle.addEventListener('click', () => {
    if (mounted) return;
    toggle.classList.add('is-loading');
    toggle.setAttribute('aria-busy', 'true');
    if (!pending) {
      pending = import('./lanyard-entry.jsx');
    }

    pending.then(({ mountLanyard }) => {
      if (mounted) return;
      mounted = true;
      mountLanyard({ initialOpen: true });
    }).finally(() => {
      toggle.classList.remove('is-loading');
      toggle.removeAttribute('aria-busy');
    });
  });
})();
