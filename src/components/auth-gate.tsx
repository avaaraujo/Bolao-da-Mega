"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminUser } from "@/components/bolao-provider";
import { Button, Field, InkTitle, Loading, Sheet } from "@/components/riso";
import type { AdminUser } from "@/lib/data";

/** Só mostra `children` para um organizador logado; senão, entrar ou criar conta. */
export function AuthGate({ children }: { children: React.ReactNode | ((user: AdminUser) => React.ReactNode) }) {
  const { user, platform } = useAdminUser();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (user === undefined) return <Loading />;
  if (user) return <>{typeof children === "function" ? children(user) : children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "criar") {
        const { confirm } = await platform.signUp(email.trim(), password);
        if (confirm) setSentTo(email.trim());
      } else {
        await platform.signIn(email.trim(), password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para entrar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <Sheet>
        <InkTitle size="lg" className="mt-6">
          CONFIRA O E-MAIL
        </InkTitle>
        <p className="mt-5 text-[18px] leading-snug text-ink">
          Mandamos um link de confirmação para {sentTo}. Depois de confirmar, volte aqui e entre com seu e-mail e senha.
        </p>
        <Button
          variant="outline"
          className="mt-8 self-start"
          onClick={() => {
            setSentTo(null);
            setMode("entrar");
          }}
        >
          Já confirmei
        </Button>
      </Sheet>
    );
  }

  const creating = mode === "criar";
  return (
    <form onSubmit={submit} className="contents">
      <Sheet>
        <InkTitle size="lg" stack className="mt-6">
          {creating ? "CRIAR\nCONTA" : "ÁREA DO\nORGANIZADOR"}
        </InkTitle>
        <p className="mt-5 text-[17px] leading-snug text-ink">
          {creating
            ? "Com uma conta você cria seus próprios bolões, cada um com sua turma, seus Pix e seus números."
            : "Entre para conferir Pix, ver o ranking dos números e montar os jogos do seu bolão."}
        </p>
        {platform.kind === "mock" && (
          <p className="mt-2 text-[15px] leading-snug text-ink-soft">Modo demo: qualquer e-mail e senha servem.</p>
        )}
        <div className="mt-7 flex flex-col gap-5">
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Senha"
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={platform.kind === "mock" ? 1 : 8}
            hint={creating ? "Pelo menos 8 caracteres." : undefined}
            required
          />
        </div>
        <Button type="submit" className="mt-8 min-h-14" disabled={busy}>
          {busy ? "Aguarde…" : creating ? "Criar conta" : "Entrar"}
        </Button>
        <button
          type="button"
          onClick={() => setMode(creating ? "entrar" : "criar")}
          className="semi mt-5 min-h-11 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4"
        >
          {creating ? "Já tenho conta" : "Criar uma conta de organizador"}
        </button>
        <Link href="/" className="semi min-h-11 self-start text-[15px] font-bold text-blue-deep underline underline-offset-4">
          Voltar ao início
        </Link>
      </Sheet>
    </form>
  );
}
