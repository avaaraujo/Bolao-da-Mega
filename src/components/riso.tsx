"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { pad2 } from "@/lib/format";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/**
 * Folha do zine. No celular, uma coluna. No desktop vira página dupla:
 * a "capa" (children + ação) fica fixa à esquerda e o trabalho (side) corre à direita.
 */
export function Sheet({
  children,
  side,
  bar,
  barIn = "cover",
  className,
}: {
  children: ReactNode;
  side?: ReactNode;
  bar?: ReactNode;
  /** No desktop, em qual coluna a ação principal fica: junto da capa ou no fim do trabalho. */
  barIn?: "cover" | "side";
  className?: string;
}) {
  return (
    <div className={cx("mx-auto flex min-h-dvh w-full max-w-[480px] flex-col", side ? "lg:max-w-[1200px]" : "lg:max-w-[600px]")}>
      <main
        className={cx(
          "flex flex-1 flex-col px-[var(--gutter)] pt-[max(20px,env(safe-area-inset-top))] lg:px-12 lg:pt-14",
          bar ? "pb-32 lg:pb-16" : "pb-10 lg:pb-16",
          !!side && "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:content-start lg:items-start lg:gap-x-[clamp(48px,6vw,96px)]",
          className,
        )}
      >
        <div className={cx("flex flex-col [container-type:inline-size]", side ? "lg:sticky lg:top-14" : "flex-1")}>
          {children}
          {(!side || barIn === "cover") && bar}
        </div>
        {side && (
          <div className="flex flex-col [container-type:inline-size] lg:pt-1">
            {side}
            {barIn === "side" && bar}
          </div>
        )}
      </main>
    </div>
  );
}

/** Título em duas passadas de tinta: azul por baixo, rosa por cima, registro deslocado.
 * Uma quebra de linha no texto vira uma nova linha; o encaixe usa a linha mais larga. */
export function InkTitle({
  children,
  size = "xl",
  as: Tag = "h1",
  className,
}: {
  children: string;
  size?: "xl" | "lg" | "md";
  as?: "h1" | "h2" | "p";
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
      const next = size === "xl" ? Math.min(scale, 2.2) : Math.min(scale, 1);
      if (Math.abs(next - 1) > 0.005) el.style.fontSize = `${Math.floor(base * next * 0.985 * 10) / 10}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [children, size]);

  return (
    <Tag
      ref={ref}
      className={cx("poster relative whitespace-nowrap pr-[0.04em] pb-[0.04em]", size === "xl" && "poster-xl", font, className)}
    >
      <span aria-hidden="true" className="ink-title absolute top-[0.045em] left-[0.04em] inline-block whitespace-pre text-blue">
        {children}
      </span>
      <span className="ink-top relative inline-block whitespace-pre text-pink">{children}</span>
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

export function Stamp({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={registration(n)}
      className={cx("stamp ink pointer-events-none absolute inset-0 m-auto aspect-square rounded-full bg-pink", className)}
    />
  );
}

/** Uma bolinha de número carimbada, para listas de números. */
export function NumberChip({ n, size = "md", stamped = true }: { n: number; size?: "sm" | "md" | "lg"; stamped?: boolean }) {
  const box = {
    sm: "h-8 w-8 text-[15px]",
    md: "h-10 w-10 text-[18px]",
    lg: "h-[13.5cqi] w-[13.5cqi] max-h-16 max-w-16 text-[clamp(20px,6.4cqi,28px)]",
  }[size];
  return (
    <span className={cx("semi relative inline-flex items-center justify-center font-bold text-blue-deep", box)}>
      {stamped && <Stamp n={n} className="h-full" />}
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
    <div className="fixed inset-x-0 bottom-0 z-40 lg:static lg:mt-10">
      <div className="mx-auto w-full max-w-[480px] bg-paper/95 px-[var(--gutter)] pt-3 pb-[max(14px,env(safe-area-inset-bottom))] backdrop-blur-[2px] lg:max-w-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
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
        <p className="display animate-pulse text-[10cqi] text-blue">Imprimindo…</p>
      </div>
    </Sheet>
  );
}
