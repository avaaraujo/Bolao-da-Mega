import { InfoPage, infoMetadata } from "@/components/info-page";
import { PRIVACY } from "@/lib/agent/content";

export const metadata = infoMetadata(PRIVACY);

export default function Page() {
  return <InfoPage page={PRIVACY} />;
}
