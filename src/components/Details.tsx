"use client";

import { CalendarRange, Clock, Map as Imap } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  name: string;
  location: string;
  coordinates: [string, string];
};

export function Details({ name, location, coordinates }: Props) {
  const [date, setDate] = useState("Loading...");
  const [time, setTime] = useState("Loading...");

  useEffect(() => {
    let intervalId: number | undefined;

    const updateTime = () => {
      const now = new Date();

      setDate(
        new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(now),
      );

      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();

    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeoutId = window.setTimeout(() => {
      updateTime();
      intervalId = window.setInterval(updateTime, 60_000);
    }, msUntilNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-2xl m-auto font-sans">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 wrap-break-word text-2xl xl:text-4xl font-semibold italic leading-tight tracking-tight text-background">
          {name}
        </h3>

        <div className="flex shrink-0 flex-col items-end gap-0.5 pt-1 font-mono text-xs xl:text-sm font-medium italic tabular-nums text-accent/95">
          <span className="whitespace-nowrap">{coordinates[0]}</span>
          <span className="whitespace-nowrap">{coordinates[1]}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-lg font-medium italic text-background/90">
        <Imap className="h-6 w-6 shrink-0 text-accent/75" />
        <span>{location}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs italic text-background/90">
        <CalendarRange className="h-5 w-5 shrink-0 text-accent/75" />
        <span>{date}</span>
        <span className="text-accent/50">|</span>
        <Clock className="h-5 w-5 shrink-0 text-accent/75" />
        <span className="tabular-nums">{time}</span>
      </div>
    </div>
  );
}
