import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import {
  Clapperboard,
  ListVideo,
  Library,
  Sparkles,
  Wand2,
  Images,
  Settings,
  LogOut,
  Menu,
  X,
  Brain,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { usePlan } from "@/lib/use-plan";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/studio", label: "Studio", icon: Clapperboard },
  { to: "/queue", label: "Queue", icon: ListVideo },
  { to: "/library", label: "Library", icon: Library },
  { to: "/presets", label: "Presets", icon: Sparkles },
  { to: "/loras", label: "LoRAs", icon: Brain },
  { to: "/vibe", label: "Vibe Matcher", icon: Wand2 },
  { to: "/assets", label: "Assets", icon: Images },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const { plan } = usePlan();
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-elegant" />
        <div>
          <div className="text-sm font-semibold tracking-tight">Style Engine</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            consistency studio
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          search={{ billing: "view" } as any}
          onClick={() => setOpen(false)}
          className="mb-2 flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent/60"
        >
          <span className="truncate text-muted-foreground">{user?.email}</span>
          {plan && (
            <span className={cn(
              "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              plan.slug === "free"
                ? "bg-muted text-muted-foreground"
                : "bg-gradient-primary text-primary-foreground shadow-elegant"
            )}>
              {plan.name}
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={async () => {
            await signOut();
            nav({ to: "/auth" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">{Sidebar}</div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{Sidebar}</div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="text-sm font-semibold">Style Engine</div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
