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
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
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
      duration: 0.9,
      ease: EASE,
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
};

/** Bloques y tarjetas: suben con desvanecido, con retraso propio si lo traen. */
const initReveals = () => {
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    const delay =
      parseFloat(getComputedStyle(el).getPropertyValue("--reveal-delay")) || 0;
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 0.9,
      ease: EASE,
      delay,
      scrollTrigger: { trigger: el, start: "top 90%" },
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
  initParallax();
  initMagnetic();
  initAccordions();
  ScrollTrigger.refresh();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
