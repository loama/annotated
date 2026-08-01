import { Suspense } from "react";
import { Studio } from "@/components/studio";

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[var(--paper)]" />}>
      <Studio />
    </Suspense>
  );
}
