"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getDataSource, type DataSource, type Snapshot } from "@/lib/data";

type Ctx = { snapshot: Snapshot | null; ds: DataSource };

const BolaoContext = createContext<Ctx | null>(null);

export function BolaoProvider({ children }: { children: React.ReactNode }) {
  const ds = useMemo(() => getDataSource(), []);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      ds.load().then((s) => {
        if (alive) setSnapshot(s);
      });
    load();
    const unsubscribe = ds.subscribe(load);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [ds]);

  return <BolaoContext.Provider value={{ snapshot, ds }}>{children}</BolaoContext.Provider>;
}

export function useBolao() {
  const ctx = useContext(BolaoContext);
  if (!ctx) throw new Error("useBolao fora do BolaoProvider");
  return ctx;
}

/** Lê uma chave de localStorage/sessionStorage de forma segura para SSR. */
const STORAGE_EVENT = "bolao-da-mega:storage";

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
