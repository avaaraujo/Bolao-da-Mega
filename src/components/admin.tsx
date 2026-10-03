"use client";

import type { ReactNode } from "react";
import { cx, InkTitle } from "./riso";

/** Folha do admin: mesma coluna do participante, com espaço para a barra de abas. */
export function AdminSheet({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col [container-type:inline-size]">
      <main className={cx("flex flex-1 flex-col px-[var(--gutter)] pt-[max(20px,env(safe-area-inset-top))]", actions ? "pb-44" : "pb-24")}>
        <InkTitle size="lg">{title}</InkTitle>
        {children}
      </main>
      {actions && (
        <div className="fixed inset-x-0 bottom-16 z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-2 bg-paper/95 px-[var(--gutter)] pt-3 pb-3 [&>*]:min-h-14 [&>*]:w-full">
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}

/** Linha de ficha: rótulo à esquerda, valor tabular à direita. */
export function Row({ label, value, strong, href }: { label: ReactNode; value: ReactNode; strong?: boolean; href?: string }) {
  const content = (
    <>
      <span className={cx("text-[17px] leading-snug", strong ? "font-bold text-ink" : "text-ink-soft")}>{label}</span>
      <span className={cx("semi text-right tabular-nums", strong ? "text-[22px] font-extrabold text-ink" : "text-[19px] font-bold text-ink")}>
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
