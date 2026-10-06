import { InfoPage, infoMetadata } from "@/components/info-page";
import { DEVELOPERS } from "@/lib/agent/content";

export const metadata = infoMetadata(DEVELOPERS);

export default function Page() {
  return <InfoPage page={DEVELOPERS} />;
}
