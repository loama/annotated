import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Privacy | Annotated",
  description: "How Annotated handles extension, account, and annotation data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-4 pb-24 pt-12 md:px-7 md:pb-32 md:pt-20">
      <Link href="/extension" className="pressable inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} weight="light" />Back to installation</Link>
      <header className="border-b border-[var(--line)] pb-14 pt-20 md:pb-20 md:pt-28">
        <span className="eyebrow">Privacy</span>
        <h1 className="display-small mt-7 max-w-[10ch]">Read closely. Collect lightly.</h1>
        <p className="mt-7 max-w-[58ch] text-base leading-relaxed text-[var(--ink-muted)]">Annotated collects only what it needs to create source-linked annotations and social interactions you explicitly choose.</p>
        <p className="mt-5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Effective August 1, 2026</p>
      </header>

      <div className="divide-y divide-[var(--line)]">
        {[
          { title: "Chrome extension", body: "The extension accesses the active tab only when you click the Annotated toolbar icon. It reads the current URL, page title, selected text, and current media time, then transfers those details directly into the embedded studio in your browser. Its access to annotated-beta.vercel.app lets that studio use your existing secure session. Chrome asks for microphone access only if you choose to record commentary. The extension does not collect browser history or monitor pages in the background. The source URL reaches our server when you request source analysis; selected text and commentary are stored only when you publish them." },
          { title: "Accounts", body: "Google verifies your identity. Annotated receives your Google account identifier, name, email address, and profile image. It never receives your Google password. We use this information to attribute annotations, comments, follows, and claims." },
          { title: "Published content", body: "Annotations, comments, and profile details are public by design. Source clips and recorded commentary are stored so their public annotation pages continue to work. Claims and their contact email addresses are private and used only to review the reported annotation." },
          { title: "Storage and retention", body: "Published annotations, comments, follows, claims, and generated media remain stored until they are removed by Annotated or at your request. Local drafts remain in your browser. We do not sell personal information or use it for advertising." },
          { title: "Security", body: "Authentication sessions use signed, secure, HTTP-only cookies. Google identity tokens are verified server-side. Private media storage is delivered through controlled application routes." },
        ].map((item) => (
          <section key={item.title} className="grid gap-5 py-9 md:grid-cols-[13rem_1fr] md:gap-10 md:py-12">
            <h2 className="text-lg font-semibold tracking-[-0.04em]">{item.title}</h2>
            <p className="max-w-[62ch] text-sm leading-7 text-[var(--ink-muted)]">{item.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-14 rounded-[1.6rem] bg-[var(--ink)] p-7 text-[var(--paper-bright)] md:p-10">
        <h2 className="text-2xl font-medium tracking-[-0.05em]">Questions or removal requests</h2>
        <p className="mt-4 max-w-[56ch] text-sm leading-7 text-white/58">Contact the publisher through the project repository. Include the public annotation URL when requesting removal of published content.</p>
        <a href="https://github.com/loama/annotated" target="_blank" rel="noreferrer" className="pressable mt-7 inline-flex items-center gap-2 text-sm font-semibold">Open the repository <ArrowUpRight size={16} weight="light" /></a>
      </section>
    </main>
  );
}
