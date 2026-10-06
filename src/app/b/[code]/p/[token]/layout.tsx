"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { rememberToken } from "@/components/bolao-provider";

/** Quem abre o link pessoal em outro aparelho também passa a "ter" a inscrição ali. */
export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { token } = useParams<{ token: string }>();
  useEffect(() => {
    if (token) rememberToken(token);
  }, [token]);
  return children;
}
