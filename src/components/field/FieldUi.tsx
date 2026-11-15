import { Activity, type LucideIcon, Sprout } from "lucide-react";
import type { ReactNode } from "react";

const panelClass =
  "group relative isolate overflow-hidden rounded-[1.65rem] border border-[#D5BC7B]/20 bg-[#1D2922]/92 p-4 text-[#F6F1E5] shadow-[0_14px_38px_rgba(10,18,13,0.3)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-7 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-[#D5BC7B]/55 before:to-transparent";

export function FieldPage({
  eyebrow,
  title,
  description,
  icon: Icon = Sprout,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-5rem)] w-full px-4 pb-10 pt-5 text-[#F6F1E5] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-5">
        <header className="relative isolate overflow-hidden rounded-[1.8rem] border border-[#D5BC7B]/20 bg-linear-to-br from-[#28372D]/95 via-[#1B2820]/95 to-[#202B24]/95 p-6 shadow-[0_16px_40px_rgba(10,18,13,0.28)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-[#D5BC7B]/[0.07] blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-5">
            <div className="max-w-4xl space-y-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D5BC7B]">
                {eyebrow}
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#F6F1E5] sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[#E8E3D7]/80">
                {description}
              </p>
            </div>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D5BC7B]/25 bg-[#D5BC7B]/[0.08] text-[#D5BC7B] sm:flex">
              <Icon aria-hidden="true" className="h-7 w-7" />
            </div>
          </div>
        </header>
        <div className="space-y-5">{children}</div>
      </div>
    </main>
  );
}

export function Panel({
  title,
  eyebrow,
  description,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${panelClass} ${className}`}>
      <header className="relative border-b border-[#D5BC7B]/15 pb-3">
        {eyebrow && (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D5BC7B]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight text-[#F6F1E5]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D5BC7B] shadow-[0_0_12px_rgba(213,188,123,0.5)]"
          />
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-4xl text-sm leading-6 text-[#E8E3D7]/75">
            {description}
          </p>
        )}
      </header>
      <div className="relative mt-4 min-w-0">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  detail,
  icon: Icon = Activity,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  detail?: string;
  icon?: LucideIcon;
}) {
  const isMissing = value === null || value === "";

  if (isMissing) {
    return null;
  }

  return (
    <div className="group relative flex min-h-32 flex-col overflow-hidden rounded-2xl border border-[#D5BC7B]/15 bg-[#18251E]/90 p-4 text-[#F6F1E5] shadow-[0_8px_24px_rgba(10,18,13,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D5BC7B]/35">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#D8C68F]">
          {label}
        </p>
        <Icon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[#D5BC7B]/80 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
        />
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-[#F6F1E5]">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-[#A3B5A0]">
            {" "}
            {unit}
          </span>
        )}
      </p>
      {detail && (
        <p className="mt-auto pt-2 text-xs leading-5 text-[#E8E3D7]/65">
          {detail}
        </p>
      )}
    </div>
  );
}

export function EvidenceNote({
  source,
  children,
}: {
  source?: {
    dataset: string;
    coverage: string;
    resolution: string;
    url: string;
  };
  children?: ReactNode;
}) {
  return (
    <div className="mt-3 border-t border-[#D5BC7B]/15 pt-3 text-xs leading-5 text-[#E8E3D7]/65">
      {children}
      {source && (
        <p className={children ? "mt-1" : ""}>
          {source.dataset} · {source.coverage} · {source.resolution} ·{" "}
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-[#D5BC7B] underline decoration-[#D5BC7B]/40 underline-offset-2 hover:text-[#F6F1E5]"
          >
            source details
          </a>
        </p>
      )}
    </div>
  );
}

export function Notice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "warning";
}) {
  return (
    <aside
      className={`rounded-2xl border p-4 ${
        tone === "warning"
          ? "border-[#D5BC7B]/30 bg-[#2C2B22]/65"
          : "border-[#D5BC7B]/20 bg-[#1D2922]/85"
      }`}
    >
      <h3 className="text-sm font-semibold text-[#F6F1E5]">{title}</h3>
      <div className="mt-1 text-sm leading-6 text-[#E8E3D7]/80">
        {children}
      </div>
    </aside>
  );
}

export function Glossary({
  terms,
  stacked = false,
}: {
  terms: Array<{ term: string; definition: string }>;
  stacked?: boolean;
}) {
  return (
    <dl className={`grid gap-3 ${stacked ? "" : "sm:grid-cols-2"}`}>
      {terms.map(({ term, definition }) => (
        <div
          key={term}
          className="rounded-xl border border-[#D5BC7B]/15 bg-[#18251E]/75 p-4"
        >
          <dt className="text-sm font-semibold text-[#F6F1E5]">{term}</dt>
          <dd className="mt-1 text-sm leading-6 text-[#E8E3D7]/75">
            {definition}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}
