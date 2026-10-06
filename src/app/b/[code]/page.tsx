import { Home } from "@/components/home";

// Sala de um bolão: dados e organizador próprios, não indexada.
export const metadata = { robots: { index: false } };

export default function Page() {
  return <Home />;
}
