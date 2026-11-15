import { Avatar, AvatarFallback } from "@component/ui/avatar";
import { ChevronDown, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS: {
  id: string;
  label: string;
}[] = [
  { id: "rotation", label: "Crop Rotation" },
  { id: "vulnerability", label: "Vulnerability" },
  { id: "profitability", label: "Profitability" },
  { id: "failure", label: "Failure Risk" },
];

const glass =
  "relative isolate overflow-hidden border border-white/25 bg-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-2xl backdrop-saturate-150 before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-linear-to-br before:from-white/25 before:via-white/[0.04] before:to-white/[0.08]";

export default function TopBar() {
  return (
    <header className="relative top-0 z-50 w-full bg-linear-to-b from-black/50 to-transparent">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-3 sm:h-20 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center">
          <span className="font-heading text-4xl font-bold tracking-tight text-accent sm:text-6xl">
            Sowlar
          </span>
          <Image
            src="/logo.png"
            alt="AgrixAI"
            width={48}
            height={48}
            priority
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className={`${glass} hidden items-center gap-1 rounded-full p-1.5 xl:flex`}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={`/${item.id}`}
              className="relative z-10 inline-flex h-10 items-center justify-center rounded-full px-4 text-base font-light text-background transition-all duration-300 hover:bg-white/20 hover:text-background active:scale-95 2xl:px-6 2xl:text-lg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <details className="relative xl:hidden">
          <summary
            aria-label="Toggle page navigation"
            className={`${glass} flex h-10 list-none cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-[#D5BC7B] sm:px-4`}
          >
            <Menu aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Pages</span>
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
          </summary>
          <nav
            aria-label="Main navigation"
            className={`${glass} absolute right-0 top-full mt-2 flex w-56 flex-col gap-1 rounded-2xl p-2`}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={`/${item.id}`}
                className="rounded-xl px-3 py-2.5 text-sm text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </details>

        <div
          className={`${glass} hidden shrink-0 items-center gap-2.5 rounded-full py-1.5 pl-2 pr-3 xl:flex`}
        >
          <Avatar className="h-9 w-9 border border-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.15)] hover:cursor-pointer">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
              FM
            </AvatarFallback>
          </Avatar>

          <div className="hidden flex-col sm:flex">
            <span className="font-heading text-sm font-semibold leading-none text-primary-foreground">
              Farm Manager
            </span>
            <span className="mt-1 text-[10px] text-white/65">
              Administrator
            </span>
          </div>

          <ChevronDown className="h-4 w-4 text-white/75 hover:cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
