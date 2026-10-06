"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Movimento do zine, todo em GSAP. A metáfora é a risografia:
 *  - páginas entram "passando pelo tambor": cada cor chega fora de registro e assenta;
 *  - números contam como contador de máquina;
 *  - carimbos respingam tinta;
 *  - barras e retículas são impressas em passadas.
 * Tudo some com `prefers-reduced-motion` (gsap.matchMedia) e nada fica com transform
 * preso no fim (clearProps), para não quebrar barras fixas nem o sticky do desktop.
 */

gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, useGSAP };

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Entrada de página: título em duas passadas de tinta e os blocos da folha em sequência. */
export function usePrintIn(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      root.removeAttribute("data-print-pending");
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out", clearProps: "transform,opacity,clipPath" } });
        const titles = root.querySelectorAll<HTMLElement>(".poster");
        titles.forEach((t, i) => {
          const blue = t.querySelector(".ink-title");
          const pink = t.querySelector(".ink-top");
          const at = i * 0.05;
          // Azul passa primeiro, deslocado para a esquerda; o rosa vem do outro lado e encaixa.
          if (blue) tl.from(blue, { x: -22, y: 8, rotate: -1.5, opacity: 0, clipPath: "inset(0 100% 0 0)", duration: 0.75 }, at);
          if (pink) tl.from(pink, { x: 26, y: -10, rotate: 1.2, opacity: 0, clipPath: "inset(0 0 0 100%)", duration: 0.85 }, at + 0.09);
        });

        // Blocos das colunas: tudo que não é o título nem a barra fixa.
        const blocks = Array.from(root.querySelectorAll<HTMLElement>(":scope > main > div > *")).filter(
          // `data-own-motion`: o bloco tem entrada própria (o canhoto do bilhete, o scanner do Pix).
          (el) => !el.classList.contains("poster") && !el.matches("[data-bar], [data-own-motion]"),
        );
        if (blocks.length) tl.from(blocks, { y: 18, opacity: 0, duration: 0.6, stagger: 0.055 }, 0.12);

        // Números de passo e afins: carimbados por cima.
        const pops = root.querySelectorAll("[data-pop]");
        if (pops.length) tl.from(pops, { scale: 1.9, rotate: -14, opacity: 0, duration: 0.5, ease: "back.out(2.2)", stagger: 0.09 }, 0.3);

        // Avisos que pedem ação balançam uma vez, como papel preso no varal.
        const wobble = root.querySelectorAll("[data-wobble]");
        if (wobble.length) tl.to(wobble, { keyframes: { rotate: [0, -2.2, 1.8, -1, 0] }, duration: 0.7, ease: "sine.inOut" }, 0.75);

        const bar = root.querySelector("[data-bar]");
        if (bar) tl.from(bar, { yPercent: 60, opacity: 0, duration: 0.55 }, 0.25);
      });
    },
    { scope },
  );
}

/** Contador de máquina: rola do valor anterior (ou de zero) até o novo. */
export function CountUp({
  value,
  format = String,
  className,
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef<number | null>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const from = last.current ?? 0;
      last.current = value;
      if (reduced() || from === value) {
        el.textContent = format(value);
        return;
      }
      const o = { v: from };
      el.textContent = format(from);
      gsap.to(o, {
        v: value,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = format(Math.round(o.v));
        },
      });
    },
    { dependencies: [value] },
  );
  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" />
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/** Respingo de tinta quando um carimbo cai: gotas soltas no papel, por cima de tudo. */
export function splash(el: Element | null | undefined, color = "var(--color-pink)") {
  if (!el || reduced()) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const drops = 9;
  for (let i = 0; i < drops; i++) {
    const d = document.createElement("span");
    const size = gsap.utils.random(3, 8);
    Object.assign(d.style, {
      position: "fixed",
      left: `${cx - size / 2}px`,
      top: `${cy - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "999px",
      background: color,
      pointerEvents: "none",
      zIndex: "70",
      mixBlendMode: "multiply",
    } as CSSStyleDeclaration);
    document.body.appendChild(d);
    const angle = (i / drops) * Math.PI * 2 + gsap.utils.random(-0.3, 0.3);
    const dist = gsap.utils.random(r.width * 0.45, r.width * 0.85);
    gsap.fromTo(
      d,
      { x: 0, y: 0, scale: 1.2, opacity: 0.95 },
      {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        scale: 0.4,
        opacity: 0,
        duration: gsap.utils.random(0.45, 0.7),
        ease: "power2.out",
        onComplete: () => d.remove(),
      },
    );
  }
  gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.55, ease: "elastic.out(1.1,0.45)", clearProps: "transform" });
}

/** Pulo curto de atenção (badge que mudou, aviso que pede olho). */
export function pop(el: Element | null | undefined) {
  if (!el || reduced()) return;
  gsap.fromTo(el, { scale: 1.45, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1,0.4)", clearProps: "transform" });
}

/** Faixa impressa em passadas: cada pedaço cresce da esquerda, um depois do outro. */
export function usePasses(scope: RefObject<HTMLElement | null>, selector: string, deps: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const parts = scope.current?.querySelectorAll(selector);
        if (!parts?.length) return;
        gsap.from(parts, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.12,
          clearProps: "transform",
          scrollTrigger: { trigger: scope.current, start: "top 92%", once: true },
        });
      });
    },
    { scope, dependencies: deps },
  );
}

/** Retícula do mapa de calor: a tinta cai do centro para as bordas. */
export function useHeatIn(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const cells = scope.current?.querySelectorAll("[data-heat]");
        if (!cells?.length) return;
        gsap.from(cells, {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(1.8)",
          stagger: { grid: [10, 6], from: "center", amount: 0.9 },
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: scope.current, start: "top 85%", once: true },
        });
      });
    },
    { scope },
  );
}

/** Bolinhas que caem do globo e quicam até o lugar. */
export function useDrop(scope: RefObject<HTMLElement | null>, selector: string) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const balls = scope.current?.querySelectorAll(selector);
        if (!balls?.length) return;
        gsap.from(balls, {
          y: -48,
          rotate: () => gsap.utils.random(-40, 40),
          opacity: 0,
          duration: 0.9,
          ease: "bounce.out",
          stagger: 0.025,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: scope.current, start: "top 90%", once: true },
        });
      });
    },
    { scope },
  );
}
