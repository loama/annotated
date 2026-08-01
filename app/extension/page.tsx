import type { Metadata } from "next";
import { headers } from "next/headers";
import { ExtensionInstall } from "@/components/extension-install";

export const metadata: Metadata = {
  title: "Install Annotated for Chrome",
  description: "Add Annotated to Chrome and capture video moments, article passages, and podcast excerpts from the native side panel.",
};

export default async function ExtensionPage() {
  const userAgent = (await headers()).get("user-agent") || "";
  const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  return <ExtensionInstall storeUrl={process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL} mobileDevice={mobileDevice} />;
}
