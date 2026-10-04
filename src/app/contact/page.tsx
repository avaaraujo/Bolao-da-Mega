import { InfoPage, infoMetadata } from "@/components/info-page";
import { CONTACT_PAGE } from "@/lib/agent/content";

export const metadata = infoMetadata(CONTACT_PAGE);

export default function Page() {
  return <InfoPage page={CONTACT_PAGE} />;
}
