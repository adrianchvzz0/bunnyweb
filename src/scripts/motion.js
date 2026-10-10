/**
 * Sistema de movimiento del sitio.
 *
 * Una sola entrada para todo: scroll suave con Lenis, revelados con GSAP
 * ScrollTrigger, títulos que entran palabra por palabra y botones imantados.
 *
 * Reglas:
 *  - Si el sistema pide reducir movimiento, no se anima nada y todo queda visible.
 *  - Lenis le pasa el tiempo a GSAP, para que scroll y animación compartan reloj.
 *  - El estado inicial (oculto) lo pone JS, no el CSS: si el script falla, el
 *    contenido se ve igual.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const EASE = "power3.out";
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Parte un texto en palabras envueltas para poder animarlas en cascada. */
const splitWords = (el) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) texts.push(node);
  }

  const words = [];
  for (const text of texts) {
    const frag = document.createDocumentFragment();
    for (const part of text.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const outer = document.createElement("span");
      outer.className = "word";
      const inner = document.createElement("span");
      inner.className = "word-inner";
      inner.textContent = part;
      outer.appendChild(inner);
      frag.appendChild(outer);
      words.push(inner);
    }
    text.replaceWith(frag);
  }
  return words;
};

/** Scroll suave: Lenis mueve la página y GSAP se entera en el mismo cuadro. */
const initSmoothScroll = () => {
  const lenis = new Lenis({ smoothWheel: true, duration: 1.05 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Los anclas del menú también pasan por Lenis.
  document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      const hash = href.slice(href.indexOf("#"));
      if (!hash || hash === "#") return;
      if (href.startsWith("/") && location.pathname !== "/") return; // desde otra página: navegación normal
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
    });
  });

  return lenis;
};

/** Títulos: cada palabra sube desde su línea al entrar en pantalla. */
const initHeadings = () => {
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = splitWords(el);
    if (!words.length) return;
    gsap.from(words, {
      yPercent: 115,
      opacity: 0,
      duration: 0.7,
      ease: EASE,
      stagger: 0.035,
      scrollTrigger: { trigger: el, start: "top 94%" },
    });
  });
};

/**
 * Bloques y tarjetas.
 *
 * Las tarjetas de una misma rejilla entran juntas, en una sola cascada corta,
 * en cuanto la rejilla asoma. Antes cada una disparaba sola al cruzar su propia
 * línea, y con el scroll suave se veían llegar a destiempo, una por una.
 */
const initReveals = () => {
  const items = gsap.utils.toArray("[data-reveal]");
  const groups = new Map();
  for (const el of items) {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  }

  groups.forEach((els, parent) => {
    gsap.set(els, { y: 18, opacity: 0 });
    ScrollTrigger.create({
      trigger: parent,
      start: "top 92%",
      once: true,
      onEnter: () =>
        gsap.to(els, {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: EASE,
          stagger: { each: 0.07, from: "start" },
          overwrite: true,
        }),
    });
  });
};

/** Entrada del hero: cae sola al cargar, sin esperar scroll. */
const initHero = () => {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;

  const title = hero.querySelector("[data-hero-title]");
  const words = title ? splitWords(title) : [];
  const tl = gsap.timeline({ defaults: { ease: EASE } });

  tl.from(hero.querySelectorAll("[data-hero-eyebrow]"), {
    y: 14,
    opacity: 0,
    duration: 0.7,
  });

  if (words.length) {
    tl.from(words, { yPercent: 115, opacity: 0, duration: 1, stagger: 0.07 }, 0.1);
  }

  tl.from(hero.querySelectorAll("[data-hero-copy]"), { y: 20, opacity: 0, duration: 0.8 }, 0.45)
    .from(hero.querySelectorAll("[data-hero-cta] > *"), { y: 18, opacity: 0, duration: 0.7, stagger: 0.09 }, 0.6)
    .from(hero.querySelectorAll("[data-hero-media]"), { y: 40, opacity: 0, scale: 0.98, duration: 1.1 }, 0.35)
    .from(hero.querySelectorAll("[data-hero-stack] > *"), { y: 14, opacity: 0, duration: 0.6, stagger: 0.05 }, 0.9);
};

/** Parallax suave: la imagen se desplaza un poco más lento que la página. */
const initParallax = () => {
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    gsap.to(el, {
      yPercent: -8,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
};

/**
 * Proyectos: paneo horizontal fijado al scroll (solo escritorio).
 *
 * La sección se ancla y el desplazamiento vertical se convierte en un
 * recorrido lateral por los paneles; cada captura se mueve un poco más lento
 * que su panel (parallax) y el contador avanza con el progreso.
 */
const initReel = () => {
  const reel = document.querySelector("[data-reel]");
  if (!reel) return;
  const inner = reel.querySelector(".reel-inner") || reel;
  const panels = gsap.utils.toArray(".reel-panel", reel);
  const works = panels.filter((p) => !p.classList.contains("reel-cta")); // el contador solo cuenta proyectos
  const counter = reel.querySelector(".reel-counter");
  const progress = reel.querySelector(".reel-progress");
  if (!panels.length) return;

  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    // Hélice descendente: la cámara baja por una escalera de caracol. Cada
    // tarjeta ocupa un peldaño; `pos` es su distancia (en peldaños) a la que
    // está de frente: negativo ya quedó arriba, positivo viene desde abajo.
    // El paso vertical es grande para que domine la sensación de descenso y
    // el giro acompañe, no al revés.
    const STEP = 50; // grados entre tarjetas
    const PITCH = () => window.innerHeight * 0.22; // subida por peldaño
    // radio amplio: las vecinas quedan a los lados sin tocar la de frente
    const RADIUS = () => Math.min(window.innerWidth * 0.46, 720);
    const last = panels.length - 1;
    const state = { p: -0.7 }; // arranca con la primera tarjeta asomando por abajo

    const layout = () => {
      panels.forEach((panel, i) => {
        const pos = i - state.p;
        const deg = pos * STEP;
        const abs = Math.abs(pos);
        const visible = abs < 2.4;
        // opacas mientras están cerca: dos tarjetas translúcidas encimadas se ven
        // como un error; el fundido solo al final, cuando ya se alejaron
        const fade = abs < 1.6 ? 0 : Math.min((abs - 1.6) / 0.8, 1);
        // al quedar de frente, la hoja sale de la carpeta por arriba y se
        // inclina un poco a la derecha, como si alguien la estuviera sacando
        const focus = 1 - Math.min(abs, 1);
        gsap.set(panel.querySelectorAll(".reel-img, .folder-blur"), { yPercent: focus * -14, rotation: focus * 3 });
        gsap.set(panel.querySelectorAll(".reel-lift"), { yPercent: focus * -8 });
        // foco de cámara: nítida al frente, desenfocada y oscura al alejarse. El
        // filtro va en las piezas y no en el panel, porque un `filter` en el
        // panel anula el backdrop-blur del marco de vidrio del cierre.
        const dim = Math.min(abs, 2) * 0.36;
        const blur = Math.max(0, abs - 0.25) * 4;
        gsap.set(panel.querySelectorAll(".reel-img, .folder-front, .reel-lift, .folder-frame:not(.folder-glass)"), {
          filter: `brightness(${1 - dim}) blur(${blur}px)`,
        });
        gsap.set(panel.querySelectorAll(".folder-dim"), { opacity: dim });
        gsap.set(panel, {
          xPercent: -50,
          yPercent: -50,
          rotationY: deg,
          y: pos * PITCH(),
          z: RADIUS() * Math.cos((deg * Math.PI) / 180) - RADIUS(),
          x: RADIUS() * Math.sin((deg * Math.PI) / 180),
          scale: 1 - Math.min(abs, 2) * 0.05,
          opacity: visible ? 1 - fade : 0,

          zIndex: 100 - Math.round(abs * 10), // la de frente siempre encima
          pointerEvents: abs < 0.5 ? "auto" : "none",
        });
      });
    };
    layout();

    const LEAD = 0.3;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: reel,
        start: () => `top ${LEAD * 100}%`,
        end: () => "+=" + (last * window.innerHeight * 0.55 + window.innerHeight * 1.1),
        pin: true,
        scrub: 1.2,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: () => {
          const i = Math.min(works.length, Math.max(1, Math.round(state.p) + 1));
          if (counter) counter.textContent = String(i).padStart(2, "0");
          if (progress) progress.style.transform = `scaleX(${Math.min(1, state.p / (works.length - 1))})`;
        },
      },
    });
    const hint = reel.querySelector(".reel-hint");
    tl
      // la pista de "desplázate" se va en cuanto el usuario ya lo hizo
      .to(hint, { opacity: 0, y: 6, ease: "power2.out", duration: 0.1 }, 0.06)
      // aterrizaje: termina de subir mientras la espiral empieza a girar
      .to(inner, { y: () => -window.innerHeight * LEAD, ease: "power2.out", duration: 0.18 }, 0)
      .to(state, { p: -0.4, ease: "power2.in", duration: 0.18, onUpdate: layout }, 0)
      // giro a velocidad constante hasta el cierre
      .to(state, { p: last, ease: "none", duration: 0.68, onUpdate: layout }, 0.18)
      // salida: la espiral no se congela, sigue subiendo mientras frena y el
      // anclaje se suelta en movimiento; la página toma el relevo hacia arriba
      .to(state, { p: last + 0.4, ease: "power1.out", duration: 0.14, onUpdate: layout }, 0.86);

    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      tl.scrollTrigger?.kill();
      gsap.set(panels, { clearProps: "all" });
    };
  });

  // en celular los paneles se apilan y entran como el resto de tarjetas
  mm.add("(max-width: 767px)", () => {
    panels.forEach((panel) => {
      gsap.from(panel, { y: 24, opacity: 0, duration: 0.6, ease: EASE, scrollTrigger: { trigger: panel, start: "top 92%", once: true } });
    });
  });
};

/**
 * Solapa de carpeta: recorta `.folder-front` con la silueta pestaña + cuerpo.
 * Un solo elemento con clip-path en px, recalculado al cambiar de tamaño, para
 * que el vidrio sea continuo y la unión sea una diagonal con curva suave.
 */
const initFolders = () => {
  const flaps = document.querySelectorAll(".folder-front");
  if (!flaps.length) return;
  const shape = (el) => {
    const W = el.offsetWidth;
    const H = el.offsetHeight;
    if (!W || !H) return;
    const tabH = parseFloat(getComputedStyle(el.closest(".folder") || el).getPropertyValue("--tab-h")) * 16 || 48;
    const tabW = W * 0.46;
    const r = 22; // esquinas exteriores
    const run = 44; // avance horizontal de la diagonal
    const d = [
      `M 0 ${H - r}`,
      `L 0 ${r}`,
      `Q 0 0 ${r} 0`,
      `L ${tabW - 10} 0`,
      // diagonal en S: sale tangente de la pestaña y aterriza tangente en el cuerpo
      `C ${tabW + 12} 0 ${tabW + run - 16} ${tabH} ${tabW + run + 6} ${tabH}`,
      `L ${W - r} ${tabH}`,
      `Q ${W} ${tabH} ${W} ${tabH + r}`,
      `L ${W} ${H - r}`,
      `Q ${W} ${H} ${W - r} ${H}`,
      `L ${r} ${H}`,
      `Q 0 ${H} 0 ${H - r}`,
      "Z",
    ].join(" ");
    el.style.clipPath = `path("${d}")`;
  };
  const ro = new ResizeObserver((entries) => entries.forEach((e) => shape(e.target)));
  flaps.forEach((el) => {
    shape(el);
    ro.observe(el);
  });
};

/**
 * Tema por sección: cada `[data-theme-section]` fija el tema cuando pasa por
 * el 60 % de la ventana, bajando o subiendo. El CSS (global.css) hace el
 * remapeo de colores con transición.
 */
const initThemes = () => {
  const sections = gsap.utils.toArray("[data-theme-section]");
  if (!sections.length) return;
  const root = document.documentElement;
  const apply = (theme) => {
    if (theme === "dark") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  };
  sections.forEach((section) => {
    const theme = section.dataset.themeSection;
    ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      end: "bottom 60%",
      onEnter: () => apply(theme),
      onEnterBack: () => apply(theme),
    });
  });
};

/** Botones imantados: se acercan al cursor y regresan al salir. */
const initMagnetic = () => {
  if (window.matchMedia("(hover: none)").matches) return;

  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.25;
    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      gsap.to(el, {
        x: (event.clientX - (rect.left + rect.width / 2)) * strength,
        y: (event.clientY - (rect.top + rect.height / 2)) * strength,
        duration: 0.5,
        ease: "power3.out",
      });
    };
    const reset = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
  });
};

/**
 * Preguntas frecuentes: el `<details>` nativo abre de golpe.
 *
 * Se intercepta el clic para animar la altura de la respuesta y, al cerrar, se
 * difiere quitar el atributo `open` hasta que termina la animación. Sin JS el
 * acordeón sigue funcionando: solo pierde la transición.
 */
const initAccordions = () => {
  document.querySelectorAll("details").forEach((details) => {
    const summary = details.querySelector("summary");
    const panel = summary?.nextElementSibling;
    if (!summary || !panel) return;

    let animation = null;

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (animation) animation.kill();

      if (!details.open) {
        details.open = true;
        animation = gsap.fromTo(
          panel,
          { height: 0, opacity: 0, y: -6 },
          {
            height: "auto",
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: EASE,
            onComplete: () => {
              gsap.set(panel, { clearProps: "height" });
              ScrollTrigger.refresh();
            },
          },
        );
      } else {
        animation = gsap.to(panel, {
          height: 0,
          opacity: 0,
          y: -6,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            details.open = false;
            gsap.set(panel, { clearProps: "height,opacity,y" });
            ScrollTrigger.refresh();
          },
        });
      }
    });
  });
};

const init = () => {
  if (prefersReducedMotion()) return;
  initSmoothScroll();
  initHero();
  initHeadings();
  initReveals();
  initReel();
  initFolders();
  // initThemes(); // tema claro por sección: desactivado por ahora (CSS y secciones siguen marcadas)
  initParallax();
  initMagnetic();
  initAccordions();
  ScrollTrigger.refresh();
  // Las posiciones se midieron antes de que cargaran fuentes e imágenes;
  // sin esto los disparadores quedan desplazados y las entradas llegan tarde.
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
