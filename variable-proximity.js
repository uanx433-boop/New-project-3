(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canUsePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (reduceMotion || !canUsePointer) return;

  const fromFontVariationSettings = "'wght' 500, 'opsz' 12";
  const toFontVariationSettings = "'wght' 900, 'opsz' 40";
  const radius = 120;
  const falloff = 'linear';
  const selector = [
    '.opening-title-wrap p',
    '.opening-title-wrap h1',
    '.hero-overlay p',
    '.hero-overlay h1',
    '.section-title span',
    '.section-title p',
    '.section-title h2',
    '.profile-copy p',
    '.skill-card span',
    '.skill-card h3',
    '.skill-card p',
    '.timeline-item strong',
    '.timeline-item p',
    '.contact-shell .kicker',
    '.contact-shell h2',
    '.contact-actions a',
    '.footer-note'
  ].join(', ');

  const mousePosition = { x: -9999, y: -9999 };
  let lastX = null;
  let lastY = null;
  let frameId = 0;
  let targets = [];

  const parseSettings = (settingsStr) => new Map(
    settingsStr
      .split(',')
      .map((item) => item.trim())
      .map((item) => {
        const [name, value] = item.split(' ');
        return [name.replace(/['"]/g, ''), parseFloat(value)];
      })
  );

  const fromSettings = parseSettings(fromFontVariationSettings);
  const toSettings = parseSettings(toFontVariationSettings);
  const parsedSettings = Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
    axis,
    fromValue,
    toValue: toSettings.get(axis) ?? fromValue
  }));

  const calculateFalloff = (distance) => {
    const norm = Math.min(Math.max(1 - distance / radius, 0), 1);

    switch (falloff) {
      case 'exponential':
        return norm ** 2;
      case 'gaussian':
        return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
      case 'linear':
      default:
        return norm;
    }
  };

  const interpolateSettings = (falloffValue) => parsedSettings
    .map(({ axis, fromValue, toValue }) => {
      const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
      return `'${axis}' ${interpolatedValue.toFixed(2)}`;
    })
    .join(', ');

  const interpolateWeight = (falloffValue) => {
    const weight = parsedSettings.find(({ axis }) => axis === 'wght');
    if (!weight) return 500;
    return Math.round(weight.fromValue + (weight.toValue - weight.fromValue) * falloffValue);
  };

  const collectTargets = () => {
    targets = Array.from(document.querySelectorAll(selector))
      .filter((target) => target.textContent?.trim())
      .filter((target) => !target.closest('.hero-depth, [aria-hidden="true"]'));

    targets.forEach((target) => {
      target.classList.add('variable-proximity-active');
      target.style.fontVariationSettings = fromFontVariationSettings;
    });
  };

  const updateTargets = () => {
    frameId = window.requestAnimationFrame(updateTargets);

    if (lastX === mousePosition.x && lastY === mousePosition.y) return;
    lastX = mousePosition.x;
    lastY = mousePosition.y;

    targets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(mousePosition.x - centerX, mousePosition.y - centerY);

      if (distance >= radius) {
        target.style.fontVariationSettings = fromFontVariationSettings;
        target.style.fontWeight = '';
        return;
      }

      const falloffValue = calculateFalloff(distance);
      target.style.fontVariationSettings = interpolateSettings(falloffValue);
      target.style.fontWeight = String(interpolateWeight(falloffValue));
    });
  };

  const handlePointerMove = (event) => {
    mousePosition.x = event.clientX;
    mousePosition.y = event.clientY;
  };

  const init = () => {
    collectTargets();
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    frameId = window.requestAnimationFrame(updateTargets);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('beforeunload', () => {
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('pointermove', handlePointerMove);
  });
})();
