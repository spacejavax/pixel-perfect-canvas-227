import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function NavLink({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
      activeProps={{ className: "text-foreground font-semibold" }}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Huvudmeny">
          <NavLink to="/kurser">Kurser</NavLink>
          <NavLink to="/om-pongi">Om Pongi</NavLink>
          {user ? (
            <>
              <NavLink to="/hem">Min sida</NavLink>
              <NavLink to="/profil">Profil</NavLink>
            </>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Logga ut
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/logga-in">Logga in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/skapa-konto">Skapa konto</Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Öppna meny">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Meny</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <NavLink to="/kurser" onClick={close}>Kurser</NavLink>
                <NavLink to="/om-pongi" onClick={close}>Om Pongi</NavLink>
                {user ? (
                  <>
                    <NavLink to="/hem" onClick={close}>Min sida</NavLink>
                    <NavLink to="/profil" onClick={close}>Profil</NavLink>
                  </>
                ) : null}
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <Button variant="outline" onClick={() => { close(); signOut(); }}>
                      Logga ut
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" onClick={close}>
                        <Link to="/logga-in">Logga in</Link>
                      </Button>
                      <Button asChild onClick={close}>
                        <Link to="/skapa-konto">Skapa konto</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}