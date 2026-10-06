import { createMockPlatform } from "./mock";
import type { DataSource, Platform } from "./source";
import { createSupabasePlatform } from "./supabase";

let instance: Platform | null = null;

export function getPlatform(): Platform {
  if (!instance) {
    instance =
      process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? createSupabasePlatform() : createMockPlatform();
  }
  return instance;
}

export function getDataSource(code: string): DataSource {
  return getPlatform().source(code);
}

export type { AdminUser, DataSource, NewBolao, Platform, ReceiptCheck, Snapshot } from "./source";
