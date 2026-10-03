"use client";

import { ButtonLink, InkTitle, Sheet } from "./riso";

export function NotFound() {
  return (
    <Sheet>
      <InkTitle size="lg" className="mt-6">BILHETE SUMIU</InkTitle>
      <p className="mt-5 text-[18px] leading-snug text-ink">
        Este link não corresponde a nenhuma inscrição. Confira se copiou o link inteiro, ou fale com o Avá.
      </p>
      <ButtonLink href="/" variant="outline" className="mt-8 self-start">
        Voltar ao início
      </ButtonLink>
    </Sheet>
  );
}
