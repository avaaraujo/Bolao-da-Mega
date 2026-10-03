import { createMockSource } from "./mock";
import type { DataSource } from "./source";
import { createSupabaseSource } from "./supabase";

let instance: DataSource | null = null;

export function getDataSource(): DataSource {
  if (!instance) {
    instance =
      process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? createSupabaseSource() : createMockSource();
  }
  return instance;
}

export type { DataSource, Snapshot } from "./source";
