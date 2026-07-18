/* ============================================================
   NEXORA CONSTRUÇÕES — motion system
   GSAP 3 + ScrollTrigger + CustomEase + Lenis
   ============================================================ */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- fallback estático (sem CDN ou reduced motion) ---------- */
  function staticFallback() {
    docEl.classList.add("no-anim");
    body.classList.remove("is-loading");
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = el.dataset.count;
    });

    // navegação continua funcional sem GSAP/Lenis
    var nav = document.getElementById("nav");
    var burger = document.getElementById("burger");
    var menu = document.getElementById("menu");
    var open = false;

    window.addEventListener("scroll", function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 80);
    }, { passive: true });

    burger.addEventListener("click", function () {
      open = !open;
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
      menu.classList.toggle("is-active", open);
      body.style.overflow = open ? "hidden" : "";
    });

    document.querySelectorAll("[data-scroll-to]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var hash = link.getAttribute("href");
        if (!hash || hash.charAt(0) !== "#") return;
        var target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        if (open) burger.click();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    staticFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.CustomEase) {
    // desaceleração premium com micro-overshoot (~3%) antes de assentar
    CustomEase.create("nexOut", "M0,0 C0.16,0.84 0.3,1.03 0.5,1.03 C0.7,1.03 0.8,1 1,1");
  }
  var EASE_OVERSHOOT = window.CustomEase ? "nexOut" : "power4.out";

  gsap.defaults({ ease: "power3.out", overwrite: "auto" });
  gsap.config({ force3D: true });

  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* ---------- split helpers ---------- */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML =
      '<span class="split-inner" aria-hidden="true">' +
      text.split(/\s+/).map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ") +
      "</span>";
    return el.querySelectorAll(".w");
  }
  function splitChars(el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML =
      '<span class="split-inner" aria-hidden="true">' +
      text.split("").map(function (c) { return '<span class="ch">' + c + "</span>"; }).join("") +
      "</span>";
    return el.querySelectorAll(".ch");
  }

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, {
        duration: 1.6,
        easing: function (t) { return 1 - Math.pow(1 - t, 4); }
      });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  /* ---------- nav / menu ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  var menuOpen = false;

  ScrollTrigger.create({
    start: 80,
    end: 999999,
    onToggle: function (self) { nav.classList.toggle("is-scrolled", self.isActive); }
  });

  function toggleMenu(force) {
    menuOpen = typeof force === "boolean" ? force : !menuOpen;
    burger.classList.toggle("is-open", menuOpen);
    burger.setAttribute("aria-expanded", String(menuOpen));
    burger.setAttribute("aria-label", menuOpen ? "Fechar menu" : "Abrir menu");
    menu.setAttribute("aria-hidden", String(!menuOpen));
    menu.classList.toggle("is-active", menuOpen);
    if (menuOpen) {
      if (lenis) lenis.stop();
      gsap.fromTo(
        menu.querySelectorAll("a"),
        { y: 44, opacity: 0, filter: "blur(10px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, stagger: 0.06, ease: "expo.out" }
      );
    } else if (lenis && !body.classList.contains("is-loading")) {
      lenis.start();
    }
  }
  burger.addEventListener("click", function () { toggleMenu(); });

  document.querySelectorAll("[data-scroll-to]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (!hash || hash.charAt(0) !== "#") return;
      e.preventDefault();
      if (menuOpen) toggleMenu(false);
      scrollToTarget(hash);
    });
  });

  /* ============================================================
     HERO — teaser reveal (montagem por fragmentos → payoff do nome)
     ============================================================ */
  var heroTitle = document.querySelector(".hero__title");
  var titleChars = splitChars(heroTitle);
  var heroMeta = gsap.utils.toArray(".hero__meta p");
  var chips = gsap.utils.toArray(".hero__chips .chip");
  var brandmark = document.querySelector(".hero__brandmark");
  var scrollcue = document.querySelector(".hero__scrollcue");
  var heroCutout = document.querySelector(".hero__cutout");

  // troca translateX(-50%) do CSS por xPercent (resiste a resize)
  [heroTitle, scrollcue].forEach(function (el) {
    gsap.set(el, { xPercent: -50, x: 0 });
  });

  // estados iniciais do reveal
  gsap.set(heroCutout, {
    y: 64,
    opacity: 0,
    scale: 1.045,
    filter: "blur(10px)",
    transformOrigin: "50% 100%"
  });
  gsap.set(titleChars, { yPercent: 112, opacity: 0, filter: "blur(14px)" });
  gsap.set(heroMeta, { opacity: 0, y: 20 });
  gsap.set(chips, { opacity: 0, y: 16 });
  gsap.set([brandmark, scrollcue], { opacity: 0 });
  gsap.set(nav, { opacity: 0, y: -16 });

  var heroTl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

  heroTl
    // 1) a casa entra em foco e assenta no lugar
    .to(heroCutout, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.35,
      ease: "power3.out",
      clearProps: "filter"
    })
    // 2) payoff: o nome sobe por trás da casa depois da imagem montada
    .to(titleChars, {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.95,
      stagger: 0.045,
      ease: "expo.out"
    }, "-=0.45")
    // 3) metadados e chrome por último
    .to(heroMeta, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 }, "-=0.55")
    .to(chips, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 }, "<0.1")
    .to(brandmark, { opacity: 1, duration: 0.6 }, "<0.1")
    .to(nav, { opacity: 1, y: 0, duration: 0.7 }, "<")
    .to(scrollcue, { opacity: 1, duration: 0.6 }, "<0.15");

  /* ---------- preloader ---------- */
  var preloader = document.querySelector(".preloader");
  var preChars = splitChars(document.querySelector(".preloader__word"));
  var introStarted = false;

  function startIntro() {
    if (introStarted) return;
    introStarted = true;

    var tl = gsap.timeline();
    tl.fromTo(preChars,
      { yPercent: 70, opacity: 0, filter: "blur(12px)" },
      { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.75, stagger: 0.05, ease: "expo.out" })
      .to(".preloader__tag", { opacity: 1, duration: 0.5 }, "-=0.35")
      .to(".preloader__line span", { scaleX: 1, duration: 0.85, ease: "expo.inOut" }, "-=0.35")
      .addLabel("wipe", "+=0.15")
      .to(preloader, { clipPath: "inset(0 0 100% 0)", duration: 0.95, ease: "expo.inOut" }, "wipe")
      .add(function () { heroTl.play(); }, "wipe+=0.35")
      .add(function () {
        preloader.style.display = "none";
        body.classList.remove("is-loading");
        if (lenis && !menuOpen) lenis.start();
        ScrollTrigger.refresh();
      });
  }

  gsap.set(preloader, { clipPath: "inset(0 0 0% 0)" });
  window.addEventListener("load", startIntro);
  setTimeout(startIntro, 3200); // teto: nunca prender o usuário no preloader

  /* ============================================================
     builders de seção
     ============================================================ */

  // revela kicker (linha cresce + texto surge)
  function revealKicker(kicker, trigger, start) {
    var line = kicker.querySelector(".kicker__line");
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger || kicker,
        start: start || "top 86%",
        toggleActions: "play none none reverse"
      }
    });
    tl.fromTo(kicker, { opacity: 0 }, { opacity: 1, duration: 0.6 })
      .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "expo.out" }, 0.1);
  }

  // título grande: palavras sobem com blur
  function revealTitleWords(words, trigger, start) {
    gsap.fromTo(words,
      { y: 60, opacity: 0, filter: "blur(20px)" },
      {
        y: 0, opacity: 1, filter: "blur(0px)",
        duration: 1.0,
        stagger: 0.09,
        ease: "expo.out",
        scrollTrigger: {
          trigger: trigger,
          start: start || "top 82%",
          toggleActions: "play none none reverse"
        }
      });
  }

  // reveal genérico de blocos .anim-up
  function genericReveals(scope) {
    gsap.utils.toArray((scope || document).querySelectorAll(".anim-up")).forEach(function (el) {
      gsap.fromTo(el,
        { y: 44, opacity: 0, filter: "blur(12px)" },
        {
          y: 0, opacity: 1, filter: "blur(0px)",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none reverse"
          }
        });
    });
  }

  /* ---------- manifesto: leitura guiada pelo scroll (scrub) ---------- */
  function buildManifesto() {
    var words = splitWords(document.querySelector(".manifesto__text"));
    gsap.fromTo(words,
      { opacity: 0.1, y: 14, filter: "blur(7px)" },
      {
        opacity: 1, y: 0, filter: "blur(0px)",
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: ".manifesto",
          start: "top 74%",
          end: "top 18%",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    revealKicker(document.querySelector(".manifesto .kicker"));
  }

  /* ---------- storytelling pinado: projetos ---------- */
  function buildStory(isMobile) {
    var scenes = gsap.utils.toArray(".story__scene");
    var imgs = scenes.map(function (s) { return s.querySelector("img"); });
    var chapters = gsap.utils.toArray(".story__chapter");
    var track = document.querySelector(".story__count-track");
    var progress = document.querySelector(".story__progress span");

    // estados iniciais
    gsap.set(imgs[0], { scale: 1.14 });
    gsap.set([scenes[1], scenes[2]], { clipPath: "inset(100% 0 0 0)" });
    gsap.set([imgs[1], imgs[2]], { scale: 1.12 });
    chapters.forEach(function (ch, i) {
      if (i > 0) gsap.set(ch.querySelectorAll(".anim"), { opacity: 0, y: 60, filter: "blur(20px)" });
    });

    // capítulo 01 entra antes do pin, na aproximação da seção
    gsap.fromTo(chapters[0].querySelectorAll(".anim"),
      { opacity: 0, y: 60, filter: "blur(20px)" },
      {
        opacity: 1, y: 0, filter: "blur(0px)",
        duration: 1.0, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: ".story", start: "top 62%", toggleActions: "play none none reverse" }
      });
    revealKicker(document.querySelector(".story__head .kicker"), document.querySelector(".story"), "top 62%");

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".story",
        start: "top top",
        end: isMobile ? "+=280%" : "+=340%",
        pin: ".story__pin",
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      },
      defaults: { ease: "none" }
    });

    function transition(at, from, to) {
      tl.to(chapters[from].querySelectorAll(".anim"), {
        opacity: 0, y: -48, filter: "blur(14px)",
        stagger: 0.05, duration: 0.45, ease: "power2.in"
      }, at)
        .to(scenes[to], { clipPath: "inset(0% 0 0 0)", duration: 0.85 }, at)
        .to(imgs[to], { scale: 1, duration: 1.5 }, at)
        .to(imgs[from], { scale: 1.12, duration: 0.85 }, at)
        .set(scenes[from], { opacity: 0 }, at + 0.87)
        .fromTo(chapters[to].querySelectorAll(".anim"),
          { opacity: 0, y: 60, filter: "blur(20px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.08, duration: 0.6, ease: "power3.out" },
          at + 0.5)
        .to(track, { yPercent: -33.34 * to, duration: 0.35, ease: "power1.inOut" }, at + 0.3);
    }

    tl.to(imgs[0], { scale: 1.04, duration: 1.15 }, 0); // zoom lento contínuo
    transition(1.15, 0, 1);
    transition(2.75, 1, 2);
    tl.to({}, { duration: 0.55 }); // respiro antes de despinar

    tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: tl.duration(), ease: "none" }, 0);
  }

  /* ---------- cards de serviços (sistema luxury reveal) ---------- */
  function buildCards(isMobile) {
    var cards = gsap.utils.toArray(".card");
    var wraps = gsap.utils.toArray(".card-wrap");

    gsap.set(cards, {
      y: 80,
      opacity: 0,
      scale: 0.96,
      filter: "blur(18px)",
      clipPath: "inset(100% 0 0 0)"
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".cards",
        start: "top 82%",
        toggleActions: "play none none reverse"
      },
      onComplete: function () {
        // libera transform/filter inline para o hover CSS assumir
        gsap.set(cards, { clearProps: "transform,filter,clipPath,opacity" });
      }
    });

    // máscara abre de baixo para cima enquanto o card sobe, desfoca e assenta
    tl.to(cards, {
      y: 0, opacity: 1, scale: 1, filter: "blur(0px)",
      duration: 1.05,
      ease: EASE_OVERSHOOT,
      stagger: 0.13
    })
      .to(cards, {
        clipPath: "inset(0% 0 0 0)",
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.13
      }, 0);

    // parallax parcial dos cards em resposta ao scroll (scrub)
    if (!isMobile) {
      wraps.forEach(function (wrap, i) {
        var amt = i % 2 === 1 ? 46 : 16;
        gsap.fromTo(wrap, { y: amt }, {
          y: -amt,
          ease: "none",
          scrollTrigger: {
            trigger: ".cards",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      });
    }

    // reflexo especular seguindo o cursor
    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });

    revealKicker(document.querySelector(".services .kicker"));
    revealTitleWords(splitWords(document.querySelector(".services .section-head__title")), ".services .section-head");
  }

  /* ---------- stats ---------- */
  function buildStats() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.dataset.count, 10);
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.2,
        ease: "expo.out",
        onUpdate: function () { el.textContent = Math.round(obj.v); },
        scrollTrigger: {
          trigger: ".stats",
          start: "top 82%",
          toggleActions: "play none none reverse"
        }
      });
    });
  }

  /* ---------- processo ---------- */
  function buildProcessDesktop() {
    var frames = gsap.utils.toArray(".process__frame");
    var frameImgs = frames.map(function (f) { return f.querySelector("img"); });
    var steps = gsap.utils.toArray(".step");
    var rail = document.querySelector(".process__rail span");
    var titleWords = splitWords(document.querySelector(".process__title"));
    var kicker = document.querySelector(".process__grid .kicker");

    gsap.set([frames[1], frames[2]], { clipPath: "inset(100% 0 0 0)" });
    gsap.set([frameImgs[1], frameImgs[2]], { scale: 1.1 });
    gsap.set(steps, { opacity: 0.14, x: 34 });

    // título e kicker entram na aproximação, antes do pin
    revealKicker(kicker, document.querySelector(".process"), "top 72%");
    revealTitleWords(titleWords, ".process", "top 72%");

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".process",
        start: "top top",
        end: "+=270%",
        pin: ".process__pin",
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      },
      defaults: { ease: "none" }
    });

    tl.fromTo(rail, { scaleY: 0 }, { scaleY: 1, duration: 4, ease: "none" }, 0);

    steps.forEach(function (step, i) {
      tl.to(step, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, i * 1 + 0.05);
    });

    tl.to(frames[1], { clipPath: "inset(0% 0 0 0)", duration: 0.7 }, 1.35)
      .to(frameImgs[1], { scale: 1, duration: 1.2 }, 1.35)
      .to(frameImgs[0], { scale: 1.08, duration: 0.7 }, 1.35)
      .to(frames[2], { clipPath: "inset(0% 0 0 0)", duration: 0.7 }, 2.7)
      .to(frameImgs[2], { scale: 1, duration: 1.2 }, 2.7)
      .to(frameImgs[1], { scale: 1.08, duration: 0.7 }, 2.7)
      .to({}, { duration: 0.3 });
  }

  function buildProcessMobile() {
    var frames = gsap.utils.toArray(".process__frame");
    gsap.set([frames[1], frames[2]], { display: "none" });
    gsap.set(".process__rail span", { scaleY: 1 });

    revealKicker(document.querySelector(".process__grid .kicker"));
    revealTitleWords(splitWords(document.querySelector(".process__title")), ".process__grid");

    gsap.fromTo(frames[0], { clipPath: "inset(100% 0 0 0)" }, {
      clipPath: "inset(0% 0 0 0)",
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: { trigger: ".process__media", start: "top 85%", toggleActions: "play none none reverse" }
    });

    gsap.utils.toArray(".step").forEach(function (step) {
      gsap.fromTo(step,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 88%", toggleActions: "play none none reverse" }
        });
    });
  }

  /* ---------- CTA final ---------- */
  function buildCta(isMobile) {
    var ghost = document.querySelector(".cta__ghost");
    gsap.set(ghost, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.fromTo(ghost, { xPercent: -56 }, {
      xPercent: -44,
      ease: "none",
      scrollTrigger: {
        trigger: ".cta",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    });

    revealKicker(document.querySelector(".cta .kicker"));
    revealTitleWords(splitWords(document.querySelector(".cta__title")), ".cta__inner");

    // botão magnético (desktop)
    if (!isMobile) {
      var btn = document.getElementById("cta-btn");
      var qx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var qy = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.22);
      });
      btn.addEventListener("pointerleave", function () { qx(0); qy(0); });
    }
  }

  /* ---------- hero: parallax de saída em camadas (scrub) ---------- */
  function buildHeroScrub() {
    gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      },
      defaults: { ease: "none" }
    })
      .to(".hero__sky", { scale: 1.1 }, 0)              // céu: zoom lento
      .to(".hero__canvas", { yPercent: 6 }, 0)          // casa: quase parada (primeiro plano)
      .to(".hero__title", { yPercent: 60 }, 0)          // a palavra desce e mergulha atrás da casa
      .to(".hero__meta", { opacity: 0, y: -26 }, 0)
      .to([".hero__chips", ".hero__brandmark"], { opacity: 0 }, 0)
      .to(".hero__scrollcue", { opacity: 0 }, 0);
  }

  /* ============================================================
     montagem por breakpoint
     ============================================================ */
  var mm = gsap.matchMedia();

  mm.add({
    desktop: "(min-width: 900px)",
    mobile: "(max-width: 899px)"
  }, function (ctx) {
    var isMobile = ctx.conditions.mobile;

    buildHeroScrub();
    buildManifesto();
    buildStory(isMobile);
    buildCards(isMobile);
    buildStats();
    if (isMobile) { buildProcessMobile(); } else { buildProcessDesktop(); }
    buildCta(isMobile);
    genericReveals();
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
