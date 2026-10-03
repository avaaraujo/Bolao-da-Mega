import type { DataSource } from "./source";

/**
 * Implementação Supabase — será feita em dezembro, quando o projeto for ativado.
 * O schema está em supabase/schema.sql. Para ativar:
 *   NEXT_PUBLIC_DATA_SOURCE=supabase
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */
export function createSupabaseSource(): DataSource {
  throw new Error(
    "Supabase ainda não configurado. Use NEXT_PUBLIC_DATA_SOURCE=mock até dezembro.",
  );
}
