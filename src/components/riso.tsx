"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { pad2 } from "@/lib/format";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/**
 * Folha do zine. No celular, uma coluna. No desktop vira página dupla do tamanho da tela:
 * a "capa" (children + ação) fica fixa à esquerda e o trabalho (side) corre à direita.
 * As duas páginas dividem uma linha de cima (títulos) e uma linha de baixo (ação, valor, rodapé):
 * o que deve sentar no pé da página usa `lg:mt-auto`.
 */
export function Sheet({
  children,
  side,
  bar,
  barIn = "cover",
  split = "work",
  className,
}: {
  children: ReactNode;
  side?: ReactNode;
  bar?: ReactNode;
  /** No desktop, em qual coluna a ação principal fica: junto da capa ou no fim do trabalho. */
  barIn?: "cover" | "side";
  /** work: a página do trabalho é a maior (volante, resultado); even: capa e trabalho pesam igual. */
  split?: "work" | "even";
  className?: string;
}) {
  return (
    <div className={cx("mx-auto flex min-h-dvh w-full max-w-[480px] flex-col", side ? "lg:max-w-[1280px]" : "lg:max-w-[600px]")}>
      <main
        className={cx(
          "flex flex-1 flex-col px-[var(--gutter)] pt-[max(20px,env(safe-area-inset-top))] lg:px-12",
          bar ? "pb-32" : "pb-10",
          side
            ? cx(
                "lg:grid lg:py-0 lg:gap-x-[clamp(48px,6vw,96px)]",
                split === "even" ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
              )
            : "lg:pt-14 lg:pb-16",
          className,
        )}
      >
        <div
          className={cx(
            "flex flex-col [container-type:inline-size]",
            side ? "lg:sticky lg:top-0 lg:min-h-dvh lg:self-start lg:py-14" : "flex-1",
          )}
        >
          {children}
          {(!side || barIn === "cover") && bar}
        </div>
        {side && (
          <div className="flex flex-col [container-type:inline-size] lg:min-h-dvh lg:py-14">
            {side}
            {barIn === "side" && bar}
          </div>
        )}
      </main>
    </div>
  );
}

/** Título em duas passadas de tinta: azul por baixo, rosa por cima, registro deslocado.
 * Uma quebra de linha no texto vira uma nova linha; o encaixe usa a linha mais larga.
 * Com `stack`, a quebra só vale no desktop: no celular o título segue numa linha só e,
 * na capa larga, empilha como cartaz. */
export function InkTitle({
  children,
  size = "xl",
  as: Tag = "h1",
  stack,
  className,
}: {
  children: string;
  size?: "xl" | "lg" | "md";
  as?: "h1" | "h2" | "p";
  stack?: boolean;
  className?: string;
}) {
  const font = { xl: "text-[15cqi]", lg: "text-[12.5cqi]", md: "text-[9cqi]" }[size];
  const ref = useRef<HTMLHeadingElement>(null);

  // Encaixa o título na largura da coluna, como um cartaz: encolhe o que não cabe,
  // e o título principal cresce até as bordas.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      const base = parseFloat(getComputedStyle(el).fontSize);
      const text = el.lastElementChild as HTMLElement | null;
      const scale = el.clientWidth / (text?.getBoundingClientRect().width || el.scrollWidth);
      // Empilhado na capa do desktop, o título vira cartaz: cresce até a largura da coluna,
      // mas nunca passa de um terço da altura da tela.
      const stacked = stack && window.matchMedia("(min-width: 1024px)").matches;
      const next = Math.min(scale, stacked ? (size === "xl" ? 3.4 : 2.2) : size === "xl" ? 2.2 : 1);
      let px = base * next * 0.985;
      if (stacked) px = Math.min(px, (window.innerHeight * 0.34) / (children.split("\n").length * 0.84));
      if (Math.abs(px / base - 1) > 0.005) el.style.fontSize = `${Math.floor(px * 10) / 10}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    if (stack) window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [children, size, stack]);

  return (
    <Tag
      ref={ref}
      className={cx("poster relative whitespace-nowrap pr-[0.04em] pb-[0.04em]", size === "xl" && "poster-xl", font, className)}
    >
      <span
        aria-hidden="true"
        className={cx("ink-title absolute top-[0.045em] left-[0.04em] inline-block text-blue", stack ? "whitespace-nowrap lg:whitespace-pre" : "whitespace-pre")}
      >
        {children}
      </span>
      <span className={cx("ink-top relative inline-block text-pink", stack ? "whitespace-nowrap lg:whitespace-pre" : "whitespace-pre")}>{children}</span>
    </Tag>
  );
}

/** Faixa de informação em fio azul. */
export function Strip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "semi flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border-2 border-blue px-3 py-2.5 text-[15px] font-semibold text-blue-deep",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Dot() {
  return (
    <span aria-hidden="true" className="text-blue">
      ·
    </span>
  );
}

/** Cabeçalho de seção: caixa-alta condensada em azul, contador opcional à direita. */
export function Label({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cx("condensed flex items-baseline justify-between gap-3 text-blue-deep", className)}>
      <h2 className="text-[19px] font-extrabold uppercase tracking-[0.01em]">{children}</h2>
      {aside && <span className="text-[19px] font-extrabold tabular-nums">{aside}</span>}
    </div>
  );
}

/** Deslocamento de registro estável por número (evita divergência entre servidor e cliente). */
function registration(n: number) {
  const sx = ((n * 37) % 7) - 3;
  const sy = ((n * 53) % 5) - 2;
  const sr = ((n * 29) % 11) - 5;
  return { "--sx": `${sx * 0.6}px`, "--sy": `${sy * 0.6}px`, "--sr": `${sr}deg` } as React.CSSProperties;
}

/** Disco de tinta rosa. `motion` diz se a tinta acabou de cair (in), está saindo (out) ou já estava no papel. */
export function Stamp({
  n,
  motion,
  delay,
  className,
}: {
  n: number;
  motion?: "in" | "out";
  delay?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ ...registration(n), ...(delay ? { "--delay": `${delay}ms` } : null) } as React.CSSProperties}
      className={cx(
        "stamp ink pointer-events-none absolute inset-0 m-auto aspect-square rounded-full bg-pink",
        motion === "in" && "stamp-in",
        motion === "out" && "stamp-out",
        className,
      )}
    />
  );
}

/** Uma bolinha de número carimbada, para listas de números. Só carimba com movimento quando `fresh`. */
export function NumberChip({
  n,
  size = "md",
  stamped = true,
  fresh,
  delay,
}: {
  n: number;
  size?: "sm" | "md" | "lg";
  stamped?: boolean;
  fresh?: boolean;
  delay?: number;
}) {
  const box = {
    sm: "h-8 w-8 text-[15px]",
    md: "h-10 w-10 text-[18px]",
    lg: "h-[13.5cqi] w-[13.5cqi] max-h-16 max-w-16 text-[clamp(20px,6.4cqi,28px)] lg:max-h-20 lg:max-w-20 lg:text-[clamp(20px,6.4cqi,34px)]",
  }[size];
  return (
    <span className={cx("semi relative inline-flex items-center justify-center font-bold text-blue-deep", box)}>
      {stamped && <Stamp n={n} motion={fresh ? "in" : undefined} delay={delay} className="h-full" />}
      <span className="relative mix-blend-multiply">{pad2(n)}</span>
    </span>
  );
}

const buttonBase =
  "condensed inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-[18px] font-extrabold uppercase tracking-[0.01em] transition-[transform,background-color,opacity] duration-150 active:translate-y-px disabled:pointer-events-none";

const variants = {
  primary: "bg-yellow text-ink disabled:bg-yellow/45",
  stamp: "bg-pink text-ink",
  outline: "border-2 border-blue text-blue-deep bg-transparent hover:bg-blue/5 disabled:opacity-40",
  danger: "border-2 border-ink text-ink bg-transparent hover:bg-ink/5 disabled:opacity-40",
  solid: "bg-ink text-paper disabled:opacity-40",
};

type Variant = keyof typeof variants;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button {...props} className={cx(buttonBase, variants[variant], className)} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={cx(buttonBase, variants[variant], className)} />;
}

/** Barra fixa no rodapé com a ação principal da tela. */
export function ActionBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:static lg:mt-auto lg:pt-10">
      <div className="mx-auto w-full max-w-[480px] bg-paper/95 px-[var(--gutter)] pt-3 pb-[max(14px,env(safe-area-inset-bottom))] lg:max-w-none lg:bg-transparent lg:p-0">
        {note && <p className="semi mb-2 text-center text-[14px] font-semibold text-ink-soft">{note}</p>}
        <div className="flex flex-col gap-2 [&>*]:w-full [&>*]:min-h-14">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="condensed text-[16px] font-extrabold uppercase text-blue-deep">{label}</span>
      <input
        {...props}
        className="semi h-13 rounded-md border-2 border-blue bg-transparent px-3 text-[19px] font-semibold text-ink placeholder:text-ink-soft/70 focus:border-pink focus:outline-none"
      />
      {hint && <span className="text-[14px] text-ink-soft">{hint}</span>}
    </label>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="condensed -ml-1 inline-flex min-h-11 items-center gap-1 self-start px-1 text-[16px] font-extrabold uppercase text-blue-deep underline-offset-4 hover:underline"
    >
      <ArrowLeft aria-hidden="true" size={18} weight="bold" /> {children}
    </Link>
  );
}

export function Loading() {
  return (
    <Sheet>
      <div className="flex flex-1 items-center justify-center">
        <p className="display text-[10cqi] text-blue motion-safe:animate-pulse">Imprimindo…</p>
      </div>
    </Sheet>
  );
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tremor curto de recusa (2–3px), para quando um toque não pode valer. Some com movimento reduzido. */
export function nudge(el: Element | null | undefined) {
  if (!el || prefersReducedMotion()) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(-2px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 240, easing: "ease-out" },
  );
}

/** Abre um painel crescendo da altura zero até a natural; depois devolve a altura ao fluxo normal. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    const anim = el.animate([{ height: "0px", opacity: 0 }, { height: `${el.scrollHeight}px`, opacity: 1 }], {
      duration: 300,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
    const done = () => (el.style.overflow = prev);
    anim.onfinish = done;
    anim.oncancel = done;
    return () => anim.cancel();
  }, []);
  return ref;
}

/** Recolhe um elemento (linha que sai de uma lista) antes de ele sumir dos dados. Resolve na hora com movimento reduzido. */
export async function collapse(el: HTMLElement | null) {
  if (!el || prefersReducedMotion() || !el.offsetParent) return () => {};
  el.style.overflow = "hidden";
  const anim = el.animate([{ height: `${el.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }], {
    duration: 220,
    easing: "cubic-bezier(0.7, 0, 0.84, 0)",
    fill: "forwards",
  });
  // A ação nunca espera a animação além do previsto (aba em segundo plano congela a linha do tempo).
  await Promise.race([anim.finished.catch(() => {}), new Promise((r) => setTimeout(r, 260))]);
  // Se a ação falhar, quem chamou devolve a linha.
  return () => {
    anim.cancel();
    el.style.overflow = "";
  };
}
