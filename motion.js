(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    document.body.classList.remove('is-opening');
    document.querySelector('.opening-animation')?.remove();
    document.querySelector('.hero-stagger-curtain')?.remove();
    document.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const easeOut = 'power4.out';
  const easeSoft = 'power3.out';
  const hero = document.querySelector('[data-hero-depth]');
  const heroBase = document.querySelector('.hero-layer-base');
  const heroType = document.querySelector('.hero-layer-type');
  const heroShadow = document.querySelector('.hero-layer-shadow');
  const heroPerson = document.querySelector('.hero-layer-person');
  const typePointer = document.querySelector('.hero-type-pointer');
  const shadowPointer = document.querySelector('.hero-shadow-pointer');
  const personPointer = document.querySelector('.hero-person-pointer');
  const shadowScroll = document.querySelector('.hero-shadow-scroll');
  const personScroll = document.querySelector('.hero-person-scroll');
  const cursorGlow = document.querySelector('.hero-cursor-glow');
  const staggerCurtain = document.querySelector('.hero-stagger-curtain');
  const staggerSlices = gsap.utils.toArray('.stagger-slice');
  document.body.classList.add('is-opening');
  let heroIntroDone = false;
  let heroAmbientStarted = false;
  let heroOpeningReleased = false;

  const heroFinalFilter = 'none';
  const shadowFinalFilter = 'blur(0.8px)';

  const startHeroAmbient = () => {
    if (heroAmbientStarted) return;
    heroAmbientStarted = true;

    if (heroPerson) {
      gsap.to(heroPerson, {
        y: '+=5',
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    if (heroType) {
      gsap.to(heroType, {
        x: 14,
        duration: 14,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  };

  const setHeroReadyState = () => {
    gsap.set(hero, { clearProps: 'opacity,visibility,filter,transform' });
    gsap.set(heroBase, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
    gsap.set(heroType, { autoAlpha: 0.45, x: 0, y: 0, scaleX: 1, scaleY: 1, clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set(heroShadow, { autoAlpha: 0.38, x: 0, y: 0, scale: 1, filter: shadowFinalFilter });
    gsap.set(heroPerson, { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: heroFinalFilter });
  };

  const releaseHeroOpeningState = () => {
    if (heroOpeningReleased) return;
    heroOpeningReleased = true;
    heroIntroDone = true;
    startHeroAmbient();
    document.body.classList.remove('is-opening');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  };

  const finishHeroOpening = () => {
    releaseHeroOpeningState();
  };

  const playHeroStaggerOpening = () => {
    if (!staggerCurtain || !staggerSlices.length) {
      finishHeroOpening();
      return;
    }

    gsap.set(staggerCurtain, { autoAlpha: 1 });
    gsap.set(staggerSlices, {
      xPercent: 0,
      yPercent: 0,
      rotation: (index) => (index % 2 === 0 ? -7.5 : 7.5),
      skewX: (index) => (index % 2 === 0 ? -5 : 5),
      scaleX: 1.08,
      opacity: 1,
      transformOrigin: '50% 50%'
    });
    gsap.set(hero, { scale: 1.018, transformOrigin: '50% 50%' });

    gsap.timeline({
      defaults: { ease: 'expo.inOut', overwrite: 'auto' },
      onComplete: () => {
        gsap.set(hero, { scale: 1, clearProps: 'transform' });
        gsap.set(staggerCurtain, { autoAlpha: 0 });
        finishHeroOpening();
      }
    })
      .to(staggerCurtain, {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        duration: 1.18,
        ease: 'power2.out'
      }, 0)
      .to(staggerSlices, {
        xPercent: (index) => (index % 2 === 0 ? 128 : -128),
        yPercent: (index) => (index < 2 ? -26 : 26),
        rotation: (index) => (index % 2 === 0 ? -13 : 13),
        skewX: (index) => (index % 2 === 0 ? -12 : 12),
        scaleX: 1.2,
        duration: 1.34,
        stagger: { each: 0.035, from: 'center' }
      }, 0)
      .to(staggerSlices, {
        opacity: 0,
        duration: 0.32,
        ease: 'sine.out',
        stagger: { each: 0.018, from: 'center' }
      }, 0.88)
      .call(releaseHeroOpeningState, null, 0.46)
      .to(hero, {
        scale: 1,
        duration: 1.2,
        ease: 'expo.out'
      }, 0);
  };

  const activateHeroAfterOpening = () => {
    setHeroReadyState();
    playHeroStaggerOpening();
  };

  {
    const openingTimeline = gsap.timeline({
      defaults: { ease: easeOut },
      onComplete: () => {
        document.querySelector('.opening-animation')?.remove();
        activateHeroAfterOpening();
      }
    });
    const openingTitleDuration = 0.96;

    gsap.set('.opening-title-wrap h1', {
      yPercent: 115,
      scaleX: 0.74,
      transformOrigin: '50% 50%'
    });
    gsap.set('.opening-title-wrap p', { yPercent: 130, opacity: 0 });
    gsap.set(hero, {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: '50% 50%'
    });
    gsap.set(heroBase, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
    gsap.set(heroType, {
      autoAlpha: 0.45,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      clipPath: 'inset(0% 0% 0% 0%)'
    });
    gsap.set(heroShadow, {
      autoAlpha: 0.38,
      x: 0,
      y: 0,
      scale: 1,
      filter: shadowFinalFilter
    });
    gsap.set(heroPerson, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: heroFinalFilter,
      transformOrigin: '58% 52%'
    });

    openingTimeline
      .to('.opening-title-wrap p', { yPercent: 0, opacity: 1, duration: 0.56 }, 0.08)
      .to('.opening-title-wrap h1', { yPercent: 0, scaleX: 1, duration: openingTitleDuration }, 0.12)
      .to('.opening-panel-left', { xPercent: -101, duration: 1.08 }, 0.48)
      .to('.opening-panel-right', { xPercent: 101, duration: 1.08 }, 0.48)
      .to('.opening-title-wrap', { y: -24, opacity: 0, duration: 0.56, ease: 'power2.out' }, 0.82);
  }

  const canUsePointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 861px)').matches;
  if (hero && canUsePointer && personPointer && shadowPointer && typePointer) {
    const personMax = 12;
    const shadowMax = 5;
    const typeMax = 3;
    const personX = gsap.quickTo(personPointer, 'x', { duration: 0.72, ease: 'power3.out' });
    const personY = gsap.quickTo(personPointer, 'y', { duration: 0.72, ease: 'power3.out' });
    const shadowX = gsap.quickTo(shadowPointer, 'x', { duration: 0.9, ease: 'power3.out' });
    const shadowY = gsap.quickTo(shadowPointer, 'y', { duration: 0.9, ease: 'power3.out' });
    const typeX = gsap.quickTo(typePointer, 'x', { duration: 1.05, ease: 'power3.out' });
    const typeY = gsap.quickTo(typePointer, 'y', { duration: 1.05, ease: 'power3.out' });
    const glowX = cursorGlow ? gsap.quickTo(cursorGlow, 'x', { duration: 0.65, ease: 'power3.out' }) : null;
    const glowY = cursorGlow ? gsap.quickTo(cursorGlow, 'y', { duration: 0.65, ease: 'power3.out' }) : null;
    const glowOpacity = cursorGlow ? gsap.quickTo(cursorGlow, 'opacity', { duration: 0.55, ease: 'power2.out' }) : null;

    hero.addEventListener('pointermove', (event) => {
      if (!heroIntroDone) return;

      const rect = hero.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;

      personX(-nx * personMax * 2);
      personY(-ny * personMax * 2);
      shadowX(-nx * shadowMax * 2);
      shadowY(-ny * shadowMax * 2);
      typeX(-nx * typeMax * 2);
      typeY(-ny * typeMax * 2);
      glowX?.(event.clientX - rect.left);
      glowY?.(event.clientY - rect.top);
      glowOpacity?.(0.1);
    });

    hero.addEventListener('pointerenter', () => {
      if (!heroIntroDone) return;

      gsap.to(heroPerson, {
        scale: 1.030,
        filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.16))',
        duration: 0.8,
        ease: 'power3.out'
      });
    });

    hero.addEventListener('pointerleave', () => {
      if (!heroIntroDone) return;

      personX(0);
      personY(0);
      shadowX(0);
      shadowY(0);
      typeX(0);
      typeY(0);
      glowOpacity?.(0);
      gsap.to(heroPerson, {
        scale: 1,
        filter: heroFinalFilter,
        duration: 0.85,
        ease: 'power3.out'
      });
    });
  }

  if (hero) {
    gsap.set([personScroll, shadowScroll], { y: 0 });
  }

  const animateGroup = (trigger, items, options = {}) => {
    const targets = gsap.utils.toArray(items).filter(Boolean);
    if (!targets.length) return;

    gsap.set(targets, {
      autoAlpha: 0,
      y: options.y ?? 88,
      scaleY: options.scaleY ?? 0.9,
      transformOrigin: '50% 100%'
    });

    gsap.to(targets, {
      autoAlpha: 1,
      y: 0,
      scaleY: 1,
      duration: options.duration ?? 1.18,
      ease: options.ease ?? easeSoft,
      stagger: options.stagger ?? 0.12,
      scrollTrigger: {
        trigger,
        start: options.start ?? 'top 72%',
        once: true
      }
    });
  };

  document.querySelectorAll('.editorial-panel, .contact-panel').forEach((panel) => {
    animateGroup(panel, panel.querySelectorAll('.section-title span, .section-title p, .section-title h2, .contact-shell .kicker, .contact-shell h2'), {
      y: 132,
      scaleY: 0.76,
      duration: 1.35,
      stagger: 0.08,
      ease: easeOut
    });

    animateGroup(panel, panel.querySelectorAll('.profile-copy p, .skill-card, .timeline-item, .contact-actions a'), {
      y: 72,
      scaleY: 0.96,
      duration: 1.05,
      stagger: 0.11,
      ease: 'power3.out',
      start: 'top 64%'
    });
  });

  document.querySelectorAll('.image-panel').forEach((panel) => {
    const image = panel.querySelector('.full-media');
    if (!image) return;

    if (!panel.classList.contains('hero-panel')) {
      gsap.set(image, {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1
      });
    }

    gsap.set(image, { yPercent: 0 });
  });

  document.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
})();
