import { InfoPage, infoMetadata } from "@/components/info-page";
import { ABOUT } from "@/lib/agent/content";

export const metadata = infoMetadata(ABOUT);

export default function Page() {
  return <InfoPage page={ABOUT} />;
}
