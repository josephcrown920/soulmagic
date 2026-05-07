import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 px-6 py-4 md:px-12">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          ← Soul Studio
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Last updated · {updated}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </main>
      <footer className="border-t border-border/40 px-6 py-8 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          <Link to="/refunds" className="hover:text-foreground">Refunds</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
