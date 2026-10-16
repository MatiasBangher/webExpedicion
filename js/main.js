/* Expedición Austral
   Motion language: a slow camera. Everything is scrubbed to the scroll, moves through depth
   (scale + blur + atmospheric fog) and resolves the way weather clears. No bounce, no snap. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = root.classList.contains('reduced');
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ smooth scroll */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  window.__site = { lenis: lenis, ScrollTrigger: ScrollTrigger, gsap: gsap };

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { duration: 2.2, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      else el.scrollIntoView();
      if (el.matches('#main, section')) el.setAttribute('tabindex', '-1');
    });
  });

  /* ------------------------------------------------------------ nav state */
  var nav = $('[data-nav]');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 1.2);
    }
  });
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });

  /* ------------------------------------------------------------ enquiry form */
  var form = $('[data-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['f-name', function (v) { return v.trim().length > 1; }], ['f-email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }]].forEach(function (rule) {
        var input = document.getElementById(rule[0]);
        var valid = rule[1](input.value);
        var field = input.closest('.field');
        field.classList.toggle('is-invalid', !valid);
        input.setAttribute('aria-invalid', String(!valid));
        document.getElementById(rule[0] + '-err').hidden = valid;
        if (!valid && ok) { input.focus(); ok = false; }
      });
      var status = $('[data-status]');
      if (!ok) { status.textContent = 'Revisa los campos marcados.'; status.classList.remove('is-ok'); return; }
      status.textContent = 'Solicitud recibida. Inés te escribirá en un plazo de dos días.';
      status.classList.add('is-ok');
      form.querySelector('button').disabled = true;
    });
  }

  /* ------------------------------------------------------------ video only plays when seen */
  var video = $('[data-video]');
  if (video) {
    if (reduced) { video.pause(); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause(); });
      }, { rootMargin: '20% 0px' }).observe(video);
    }
  }

  if (reduced) return;

  /* ------------------------------------------------------------ helpers */
  function maskLines(el) {
    var split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    return split.lines;
  }

  function start() {
    hero();
    manifesto();
    route();
    expeditions();
    voices();
    plan();
    footer();
    lineReveals();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ------------------------------------------------------------ 1. hero: alpenglow ignites, then a camera dolly into the fog */
  function hero() {
    var title = $('[data-hero-title]');
    var chars = new SplitText($$('.hero__line', title), { type: 'chars', charsClass: 'char' }).chars;
    gsap.set(title, { opacity: 1, filter: 'blur(0px)' });

    var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from('.layer--sky img', { opacity: 0, duration: 1.8, ease: 'sine.out' }, 0)
      .from('[data-depth="massif"]', { yPercent: 2.5, duration: 3.2, ease: 'power2.out' }, 0)
      .from('[data-depth="far"]', { yPercent: 1.5, duration: 3.2, ease: 'power2.out' }, 0)
      .to('[data-glow]', { opacity: 1, duration: 3.4, ease: 'sine.inOut' }, 0.9)
      .fromTo(chars, { yPercent: 70, opacity: 0, filter: 'blur(16px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 2, stagger: { each: 0.04, from: 'center' } }, 0.5)
      .fromTo('[data-hero-intro]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4 }, 1.9)
      .to(nav, { opacity: 1, duration: 1.2 }, 2.1);

    // Ambient: fog breathes sideways, very slowly (images are scaled so edges never show)
    gsap.to('.layer--fog-back img', { xPercent: 2.5, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.layer--fog-front img', { xPercent: -3, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.set(['.layer--fog-back img', '.layer--fog-front img'], { scale: 1.08 });

    var depth = {
      sky: { scale: 1.06, yPercent: -2 },
      clouds: { scale: 1.16, yPercent: -9 },
      far: { scale: 1.12, yPercent: -4 },
      massif: { scale: 1.3, yPercent: -7 },
      fogBack: { scale: 1.65, yPercent: -16 },
      ridge: { scale: 1.75, yPercent: 16 },
      fogFront: { scale: 2.3, yPercent: -16, opacity: 1 },
      rockL: { xPercent: -40, yPercent: 28, scale: 1.5 },
      rockR: { xPercent: 40, yPercent: 28, scale: 1.5 }
    };
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: '+=170%', scrub: 1.2, pin: true, anticipatePin: 1 }
    });
    Object.keys(depth).forEach(function (k) {
      tl.to('[data-depth="' + k + '"]', Object.assign({ duration: 1 }, depth[k]), 0);
    });
    tl.to(title, { y: function () { return -window.innerHeight * 0.2; }, scale: 1.24, duration: 1 }, 0)
      .to(title, { opacity: 0, filter: 'blur(10px)', duration: 0.4 }, 0.38)
      .to('[data-hero-intro]', { y: -90, opacity: 0, duration: 0.3 }, 0)
      .to('[data-veil]', { opacity: 1, duration: 0.42 }, 0.58);
  }

  /* ------------------------------------------------------------ 2. manifesto: each word clears out of the fog, scrubbed */
  function manifesto() {
    var words = new SplitText('[data-fogwords]', { type: 'words', wordsClass: 'word' }).words;
    gsap.set(words, { opacity: 0.16, filter: 'blur(7px)', yPercent: 10 });
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=150%', scrub: 0.8, pin: true }
    });
    tl.to(words, { opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: 1, stagger: 0.16 })
      .from('[data-sign]', { opacity: 0, y: 14, duration: 2 }, '-=1.2');
    snow($('[data-snow]'));
  }

  // Snow with depth of field: far flakes are small and sharp, near flakes large and soft.
  function snow(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, flakes = [], running = false, last = 0;
    function size() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(160, (w * h) / 9000));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push(make(true));
    }
    function make(any) {
      var z = Math.pow(Math.random(), 1.6);
      return { x: Math.random() * w, y: any ? Math.random() * h : -10, z: z, r: 0.5 + z * 3.6, v: 8 + z * 46, ph: Math.random() * 6.28 };
    }
    function frame(t) {
      if (!running) return;
      var dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      var vel = lenis ? lenis.velocity : 0;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += (f.v - vel * 6 * f.z) * dt;
        f.x += Math.sin(t / 1600 + f.ph) * (6 + f.z * 18) * dt + 10 * dt;
        if (f.y > h + 12 || f.y < -40) { flakes[i] = make(false); if (vel < 0) flakes[i].y = h + 8; continue; }
        if (f.x > w + 10) f.x = -10;
        var a = 0.18 + f.z * 0.5;
        if (f.z > 0.72) {
          var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.4);
          g.addColorStop(0, 'rgba(230,237,242,' + (a * 0.55).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(230,237,242,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 2.4, 0, 6.283); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(230,237,242,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      if (!vis) running = false;
    }).observe(canvas);
  }

  /* ------------------------------------------------------------ 3. route: vertical scroll drives a horizontal traverse */
  function route() {
    var pin = $('[data-route]');
    var track = $('[data-track]');
    var stops = $$('[data-stop]', track);
    var line = $('[data-route-line]');
    var marks = $$('.route__marks li');
    var len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var stopP = [];
    function measure() {
      var d = dist() || 1;
      stopP = stops.map(function (s) { return gsap.utils.clamp(0, 1, (s.offsetLeft + s.offsetWidth / 2 - window.innerWidth / 2) / d); });
    }
    function lineFraction(p) {
      var xs = [0].concat(stopP, [1]);
      var fs = [0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99];
      for (var i = 1; i < xs.length; i++) {
        if (p <= xs[i]) { var t = (p - xs[i - 1]) / Math.max(1e-6, xs[i] - xs[i - 1]); return fs[i - 1] + (fs[i] - fs[i - 1]) * t; }
      }
      return 0.99;
    }
    var h = gsap.to(track, {
      x: function () { return -dist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: function () { return '+=' + dist(); },
        pin: true, scrub: 1, invalidateOnRefresh: true, onRefresh: measure,
        onUpdate: function (self) {
          var f = lineFraction(self.progress);
          line.style.strokeDashoffset = String(len * (1 - f));
          marks.forEach(function (m, i) { m.classList.toggle('is-reached', f >= 0.1 + i * 0.2 - 0.005); });
        }
      }
    });
    measure();
    stops.forEach(function (stop) {
      var frame = $('.stop__frame', stop);
      var img = $('.stop__img', stop);
      gsap.fromTo(frame, { clipPath: 'inset(0% 0% 0% 100%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: stop, containerAnimation: h, start: 'left 105%', end: 'left 45%', scrub: true }
      });
      gsap.fromTo(img, { xPercent: -7, scale: 1.12 }, {
        xPercent: 7, scale: 1, ease: 'none',
        scrollTrigger: { trigger: stop, containerAnimation: h, start: 'left right', end: 'right left', scrub: true }
      });
      gsap.from($$('.stop__meta > *', stop), {
        y: 26, opacity: 0, duration: 1.2, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: stop, containerAnimation: h, start: 'left 62%', toggleActions: 'play none none reverse' }
      });
    });
  }

  /* ------------------------------------------------------------ 4. expeditions: a lens opens, the card slides over, depth blur on exit */
  function expeditions() {
    $$('[data-exp]').forEach(function (exp) {
      var media = $('[data-exp-media]', exp);
      var img = $('img', media);
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: exp, start: 'top bottom', end: 'top top', scrub: 1 } })
        .fromTo(media, { clipPath: 'inset(24% 28% 24% 28%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
        .fromTo(img, { scale: 1.4 }, { scale: 1.02 }, 0);
      // Explicit start values: tweening from `filter: none` would interpolate brightness from 0 (black).
      gsap.fromTo(img, { filter: 'blur(0px) brightness(1)' }, {
        filter: 'blur(6px) brightness(0.72)', ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: exp, start: 'bottom bottom', end: 'bottom top', scrub: true }
      });
      var card = $('.exp__card', exp);
      gsap.from(card.children, {
        y: 40, opacity: 0, duration: 1.3, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
    });
  }

  /* ------------------------------------------------------------ 5. testimonial: the cloud loop drifts slower than the page */
  function voices() {
    gsap.fromTo('[data-voices-media]', { yPercent: -7 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: '.voices', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.from('.voices__cite', { opacity: 0, y: 16, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.voices__cite', start: 'top 88%' } });
  }

  /* ------------------------------------------------------------ 6. booking: alpenglow rises behind the ridge */
  function plan() {
    gsap.fromTo('[data-glow-rise]', { yPercent: 30, scaleY: 0.6, opacity: 0.2 }, {
      yPercent: 0, scaleY: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.plan', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
    gsap.from('.plan__ridge', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.plan', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.from('.form > *', {
      y: 22, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.form', start: 'top 80%' }
    });
  }

  function footer() {
    var chars = new SplitText('[data-footer-word] span', { type: 'chars', charsClass: 'char', mask: 'chars' }).chars;
    gsap.from(chars, {
      yPercent: 105, duration: 1.6, stagger: 0.03, ease: 'expo.out',
      scrollTrigger: { trigger: '.footer', start: 'top 70%' }
    });
  }

  function lineReveals() {
    $$('[data-lines]').forEach(function (el) {
      var lines = maskLines(el);
      gsap.from(lines, {
        yPercent: 108, duration: 1.5, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 82%', containerAnimation: undefined }
      });
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else window.addEventListener('load', start);
})();
