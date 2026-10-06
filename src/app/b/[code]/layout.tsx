"use client";

import { useParams } from "next/navigation";
import { BolaoProvider, useBolao } from "@/components/bolao-provider";
import { NotFoundView } from "@/components/not-found";
import { Loading } from "@/components/riso";

function Gate({ children }: { children: React.ReactNode }) {
  const { missing, snapshot } = useBolao();
  if (missing) return <NotFoundView />;
  if (!snapshot) return <Loading />;
  return <>{children}</>;
}

export default function BolaoLayout({ children }: { children: React.ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const normalized = decodeURIComponent(code).toUpperCase();
  return (
    <BolaoProvider key={normalized} code={normalized}>
      <Gate>{children}</Gate>
    </BolaoProvider>
  );
}
