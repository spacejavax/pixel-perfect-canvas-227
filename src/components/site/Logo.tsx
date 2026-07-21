import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-foreground"
      aria-label="Pongi startsida"
    >
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
      >
        <span className="text-sm font-black">P</span>
      </span>
      <span>Pongi</span>
    </Link>
  );
}