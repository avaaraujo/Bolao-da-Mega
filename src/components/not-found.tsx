"use client";

import { useBolao } from "./bolao-provider";
import { ButtonLink, InkTitle, Sheet } from "./riso";

/** Link pessoal que não corresponde a nenhuma inscrição desta sala. */
export function NotFound() {
  const { base } = useBolao();
  return (
    <Sheet>
      <InkTitle size="lg" className="mt-6">BILHETE SUMIU</InkTitle>
      <p className="mt-5 text-[18px] leading-snug text-ink">
        Este link não corresponde a nenhuma inscrição. Confira se copiou o link inteiro, ou fale com quem organiza o bolão.
      </p>
      <ButtonLink href={base} variant="outline" className="mt-8 self-start">
        Voltar ao início
      </ButtonLink>
    </Sheet>
  );
}

/** Código de sala inexistente. */
export function NotFoundView() {
  return (
    <Sheet>
      <InkTitle size="lg" className="mt-6">SALA NÃO ACHADA</InkTitle>
      <p className="mt-5 text-[18px] leading-snug text-ink">
        Não existe bolão com esse código. Confira o link ou o código que o organizador mandou (algo como FIRMA-7K3Q).
      </p>
      <ButtonLink href="/" variant="outline" className="mt-8 self-start">
        Digitar outro código
      </ButtonLink>
    </Sheet>
  );
}
