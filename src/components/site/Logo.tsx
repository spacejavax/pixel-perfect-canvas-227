import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/pongi-logo.png.asset.json";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
      aria-label="Pongi startsida"
    >
      <img
        src={logoAsset.url}
        alt=""
        aria-hidden
        className="h-9 w-9 rounded-xl"
      />
      <span>Pongi</span>
    </Link>
  );
}