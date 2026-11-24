import { cn } from "@/lib/utils";

/** Hand-drawn twin cherry motif, colored entirely by design tokens. */
export function Cherry({ className, sway = false }: { className?: string; sway?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn("inline-block", sway && "animate-cherry-sway", className)}
    >
      <path
        d="M24 6c-2 8-7 14-12 20M24 6c2 7 4 14 10 22"
        className="stroke-stem"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M24 6c5-4 12-3 15 1-5 3-11 3-15-1z" className="fill-leaf" />
      <circle cx="12" cy="32" r="9" className="fill-cherry" />
      <circle cx="34" cy="34" r="9" className="fill-cherry-deep" />
      <ellipse cx="9" cy="29" rx="2.4" ry="1.6" className="fill-cherry-shine" opacity="0.85" />
      <ellipse cx="31" cy="31" rx="2.4" ry="1.6" className="fill-cherry-shine" opacity="0.7" />
    </svg>
  );
}