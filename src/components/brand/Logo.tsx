import { Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/constants";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`}>
      <img
        src={BRAND.logo}
        alt={`${BRAND.name} logo`}
        width={36}
        height={36}
        className="h-9 w-9 object-contain transition-smooth group-hover:scale-105"
      />
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          {BRAND.name}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {BRAND.slogan}
        </span>
      </div>
    </Link>
  );
}
