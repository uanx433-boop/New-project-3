(() => {
  const toggle = document.querySelector('[data-lanyard-toggle]');
  if (!toggle) return;

  let mounted = false;
  let pending = null;

  toggle.addEventListener('click', () => {
    if (mounted) return;
    if (!pending) {
      pending = import('./lanyard-entry.jsx');
    }

    pending.then(({ mountLanyard }) => {
      if (mounted) return;
      mounted = true;
      mountLanyard({ initialOpen: true });
    });
  });
})();
