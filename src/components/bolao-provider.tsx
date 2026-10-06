"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getDataSource, getPlatform, type AdminUser, type DataSource, type Snapshot } from "@/lib/data";

type Ctx = {
  /** `null` enquanto carrega ou quando a sala não existe (ver `missing`). */
  snapshot: Snapshot | null;
  missing: boolean;
  ds: DataSource;
  code: string;
  /** Prefixo das rotas desta sala: `/b/CODIGO`. */
  base: string;
};

const BolaoContext = createContext<Ctx | null>(null);

export function BolaoProvider({ code, children }: { code: string; children: React.ReactNode }) {
  const ds = useMemo(() => getDataSource(code), [code]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      ds
        .load()
        .then((s) => {
          if (!alive) return;
          setSnapshot(s);
          setMissing(s === null);
        })
        .catch(() => alive && setMissing(true));
    load();
    const unsubscribe = ds.subscribe(load);
    const stopMine = subscribeStored(load);
    const stopAuth = getPlatform().onAuthChange(load);
    return () => {
      alive = false;
      unsubscribe();
      stopMine();
      stopAuth();
    };
  }, [ds]);

  const value = useMemo(() => ({ snapshot, missing, ds, code, base: `/b/${code}` }), [snapshot, missing, ds, code]);
  return <BolaoContext.Provider value={value}>{children}</BolaoContext.Provider>;
}

export function useBolao() {
  const ctx = useContext(BolaoContext);
  if (!ctx) throw new Error("useBolao fora do BolaoProvider");
  return ctx;
}

/** Usuário organizador logado (ou null). `undefined` enquanto verifica. */
export function useAdminUser() {
  const platform = useMemo(() => getPlatform(), []);
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const check = () => platform.getUser().then((u) => alive && setUser(u)).catch(() => alive && setUser(null));
    check();
    const stop = platform.onAuthChange(check);
    return () => {
      alive = false;
      stop();
    };
  }, [platform]);
  return { user, platform };
}

/** Lê uma chave de localStorage/sessionStorage de forma segura para SSR. */
const STORAGE_EVENT = "bolao-da-mega:storage";

function subscribeStored(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(STORAGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(STORAGE_EVENT, cb);
  };
}

export function useStoredValue(area: "local" | "session", key: string): string | null | undefined {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      window.addEventListener(STORAGE_EVENT, cb);
      return () => {
        window.removeEventListener("storage", cb);
        window.removeEventListener(STORAGE_EVENT, cb);
      };
    },
    () => {
      try {
        return (area === "local" ? localStorage : sessionStorage).getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined, // no servidor: ainda não sabemos
  );
}

export function writeStoredValue(area: "local" | "session", key: string, value: string) {
  try {
    (area === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

// Inscrições feitas neste aparelho, para o participante voltar ao próprio bilhete.
const MINE = "bolao-da-mega:mine";

function parseTokens(raw: string | null | undefined): string[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberToken(token: string) {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(MINE);
  } catch {}
  const list = parseTokens(raw);
  if (!list.includes(token)) writeStoredValue("local", MINE, JSON.stringify([...list, token]));
}

export function useMyTokens() {
  const raw = useStoredValue("local", MINE);
  return useMemo(() => parseTokens(raw), [raw]);
}
