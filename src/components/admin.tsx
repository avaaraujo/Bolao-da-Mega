"use client";

import { useRef, type ReactNode } from "react";
import { cx, InkTitle } from "./riso";
import { usePrintIn } from "./motion";

const SPLITS = {
  even: "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
  "wide-left": "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
  "wide-right": "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
};

/**
 * Folha do admin. No celular, a coluna com espaço para as abas.
 * No desktop, duas colunas ao lado do trilho; a ação principal fica no fim da coluna da esquerda.
 */
export function AdminSheet({
  title,
  children,
  side,
  actions,
  split = "even",
  stickySide,
}: {
  title: string;
  children: ReactNode;
  side?: ReactNode;
  actions?: ReactNode;
  split?: keyof typeof SPLITS;
  stickySide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePrintIn(ref);
  return (
    <div
      ref={ref}
      data-print-pending=""
      className={cx("mx-auto flex min-h-dvh w-full max-w-[480px] flex-col", side ? "lg:max-w-[1180px]" : "lg:max-w-[760px]")}
    >
      <main
        className={cx(
          "flex flex-1 flex-col px-[var(--gutter)] pt-[max(20px,env(safe-area-inset-top))] lg:px-12 lg:pt-12 lg:pb-16",
          actions ? "pb-44" : "pb-24",
          !!side && cx("lg:grid lg:content-start lg:items-start lg:gap-x-14", SPLITS[split]),
        )}
      >
        <div className="[container-type:inline-size] lg:col-span-2 lg:mb-6 lg:max-w-[560px]">
          <InkTitle size="lg">{title}</InkTitle>
        </div>
        <div className="flex flex-col [container-type:inline-size]">
          {children}
          {actions && (
            <div data-bar className="fixed inset-x-0 bottom-16 z-40 pb-[env(safe-area-inset-bottom)] lg:static lg:mt-8 lg:pb-0">
              <div className="mx-auto flex w-full max-w-[480px] flex-col gap-2 bg-paper/95 px-[var(--gutter)] pt-3 pb-3 lg:max-w-none lg:bg-transparent lg:p-0 [&>*]:min-h-14 [&>*]:w-full">
                {actions}
              </div>
            </div>
          )}
        </div>
        {side && <div className={cx("flex flex-col [container-type:inline-size]", stickySide && "lg:sticky lg:top-10")}>{side}</div>}
      </main>
    </div>
  );
}

/** Linha de ficha: rótulo à esquerda, valor tabular à direita. */
export function Row({ label, value, strong, href }: { label: ReactNode; value: ReactNode; strong?: boolean; href?: string }) {
  const content = (
    <>
      <span className={cx("text-[17px] leading-snug", strong ? "font-bold text-ink" : "text-ink-soft")}>{label}</span>
      <span
        className={cx("semi text-right tabular-nums", strong ? "text-[22px] font-extrabold text-ink" : "text-[19px] font-bold text-ink")}
      >
        {value}
      </span>
    </>
  );
  const cls = "flex min-h-13 items-center justify-between gap-4 border-t border-blue/40 py-2.5 first:border-t-0";
  return href ? (
    <a href={href} className={cx(cls, "hover:bg-paper-deep")}>
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}
