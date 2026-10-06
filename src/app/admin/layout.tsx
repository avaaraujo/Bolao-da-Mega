import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = { robots: { index: false } };

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
