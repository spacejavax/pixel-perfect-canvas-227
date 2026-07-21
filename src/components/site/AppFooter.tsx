import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Pongi gör privatekonomi enklare att förstå.
          </p>
        </div>
        <nav aria-label="Sidfotslänkar" className="flex flex-col gap-2 text-sm">
          <Link to="/kurser" className="text-foreground/80 hover:text-foreground">
            Kurser
          </Link>
          <Link to="/om-pongi" className="text-foreground/80 hover:text-foreground">
            Om Pongi
          </Link>
          <Link to="/integritet" className="text-foreground/80 hover:text-foreground">
            Integritet
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground md:text-right">
          Pongi erbjuder utbildande innehåll och inte personlig finansiell rådgivning.
          <br />© {year} Pongi
        </p>
      </div>
    </footer>
  );
}