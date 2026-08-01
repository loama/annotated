import type { Metadata } from "next";
import { ExtensionInstall } from "@/components/extension-install";

export const metadata: Metadata = {
  title: "Install Annotated for Chrome",
  description: "Add Annotated to Chrome and capture video moments, article passages, and podcast excerpts from the native side panel.",
};

export default function ExtensionPage() {
  return <ExtensionInstall storeUrl={process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL} />;
}
