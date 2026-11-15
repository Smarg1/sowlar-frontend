import { ArrowLeft, Compass, MapPinOff, Satellite } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex-1 w-full h-[calc(100vh-4rem)] flex items-center justify-center p-6 overflow-hidden">
      <div className="relative w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden bg-[#34483A]/65 backdrop-blur-xl border border-[#A3B5A0]/30 shadow-[0_12px_40px_0_rgba(41,51,45,0.45)] font-sans text-[#F7F6F0]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#F7F6F0]/35 to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#A3B5A0]/15 blur-2xl"
        />

        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#A3B5A0]/30 bg-[#29332D]/50 text-[#A3B5A0] shadow-inner">
          <MapPinOff className="h-7 w-7 stroke-[1.75]" />
          <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#A3B5A0]/40 bg-[#34483A] text-[#F7F6F0]">
            <Satellite className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#A3B5A0]/30 bg-[#29332D]/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#A3B5A0]">
          <Compass className="h-3.5 w-3.5 animate-spin animation-duration-[12s]" />
          <span>Error 404 • Unmapped Sector</span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7F6F0]">
          Coordinates Out of Bounds
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#E7E8DF]/80">
          The field parcel or telemetry route you requested lies outside our
          active satellite coverage grid.
        </p>

        <div className="my-6 h-px w-full bg-[#A3B5A0]/20" />

        <Link
          href="/"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#A3B5A0]/40 bg-[#F7F6F0] px-5 py-3 text-sm font-medium text-[#29332D] transition-all duration-200 hover:bg-[#A3B5A0] hover:text-[#29332D]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Return to Field Dashboard</span>
        </Link>
      </div>
    </main>
  );
}
