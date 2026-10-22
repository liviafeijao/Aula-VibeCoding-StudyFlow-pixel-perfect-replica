import { Link } from "@tanstack/react-router";
import { Moon, Sun, Sprout, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { navItems } from "./nav-items";
import { useTheme } from "@/hooks/use-theme";
import { useStudyData } from "@/hooks/use-study-data";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Sprout className="size-5" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">StudyFlow</span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: item.to === "/" }}
          className="nav-link"
          activeProps={{ "data-active": "true" }}
        >
          <item.icon className="size-4.5" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { error } = useStudyData();
  const [open, setOpen] = useState(false);
  const themeLabel = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <NavList />
        </div>
        <Button variant="ghost" className="justify-start gap-3" onClick={toggle} aria-label={themeLabel}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Tema claro" : "Tema escuro"}
        </Button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <Menu className="size-5" />
        </Button>
        <Brand />
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={themeLabel}>
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="mt-2">
            <Brand />
          </div>
          <div className="mt-8">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl animate-rise">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      </main>

      <nav
        aria-label="Navegação rápida"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {navItems
          .filter((i) => i.mobile)
          .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="tab-link"
              activeProps={{ "data-active": "true" }}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          ))}
      </nav>
    </div>
  );
}
