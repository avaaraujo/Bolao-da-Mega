"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { ActionBar, Button, ButtonLink, Field, InkTitle, Label, Sheet } from "@/components/riso";
import { DEMO_CODE } from "@/lib/data/seed";
import { RULES, STEPS } from "@/lib/agent/content";

export function Landing() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const demo = process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase";

  function enter(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/\s+/g, "");
    if (clean) router.push(`/b/${encodeURIComponent(clean)}`);
  }

  return (
    <Sheet
      split="even"
      bar={
        <ActionBar>
          <ButtonLink href="/admin" variant="outline">
            Criar meu bolão <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </ButtonLink>
        </ActionBar>
      }
      side={
        <>
          <section className="mt-8 lg:mt-0">
            <Label>Como funciona</Label>
            <ol className="mt-3 flex flex-col lg:mt-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex items-baseline gap-4 border-t border-blue/40 py-3 first:border-t-0 lg:gap-7 lg:py-6">
                  <span data-pop className="display ink inline-block w-7 shrink-0 text-[34px] text-pink lg:w-14 lg:text-[76px]">{i + 1}</span>
                  <span className="flex flex-col">
                    <span className="condensed text-[20px] font-extrabold uppercase leading-tight text-ink lg:text-[30px]">{s.title}</span>
                    <span className="text-[16px] leading-snug text-ink-soft lg:text-[19px]">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <details className="mt-4 border-t border-blue/40 pt-3">
            <summary className="condensed cursor-pointer text-[19px] font-extrabold uppercase text-blue-deep">Regras do bolão</summary>
            <ul className="mt-2 flex flex-col gap-2 text-[15px] leading-snug text-ink-soft">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </details>

          <footer className="mt-10 flex flex-col gap-3 text-[14px] text-ink-soft lg:mt-auto lg:pt-10">
            <nav aria-label="Sobre o bolão" className="semi flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              <Link href="/about" className="underline underline-offset-4">Sobre</Link>
              <Link href="/contact" className="underline underline-offset-4">Contato</Link>
              <Link href="/privacy" className="underline underline-offset-4">Privacidade</Link>
            </nav>
          </footer>
        </>
      }
    >
      <InkTitle stack>{"BOLÃO\nDA MEGA"}</InkTitle>
      <p className="semi mt-3 text-[18px] font-bold text-blue-deep lg:mt-5 lg:text-[22px]">
        Monte o bolão da sua turma: cotas, Pix, comprovante e 6 números de cada um.
      </p>

      <form onSubmit={enter} className="mt-8 flex flex-col gap-4 lg:mt-auto lg:pt-12">
        <Field
          label="Tem um código de bolão?"
          hint="O organizador manda no grupo, algo como FIRMA-7K3Q."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={20}
        />
        <Button type="submit" disabled={!code.trim()}>
          Entrar na sala <ArrowRight size={20} weight="bold" aria-hidden="true" />
        </Button>
        {demo && (
          <Link href={`/b/${DEMO_CODE}`} className="semi min-h-11 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4">
            Ver o bolão de exemplo (modo demo)
          </Link>
        )}
      </form>
    </Sheet>
  );
}
