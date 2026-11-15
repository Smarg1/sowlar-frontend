"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  date: string;
  [key: string]: number | string | null;
}

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

type RangeId = "all" | "5y" | "1y" | "90d";

const rangeOptions: Array<[RangeId, string]> = [
  ["all", "All available"],
  ["5y", "5 years"],
  ["1y", "1 year"],
  ["90d", "90 days"],
];

function filterRange(data: TrendPoint[], range: RangeId) {
  if (range === "all" || data.length === 0) {
    return data;
  }

  const newest = data.at(-1)?.date;
  if (!newest) return data;

  const newestDate = newest.length === 7 ? `${newest}-01` : newest;

  const cutoff = new Date(`${newestDate}T00:00:00Z`);
  const days = range === "90d" ? 90 : range === "1y" ? 365 : 365 * 5;

  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const cutoffDate = cutoff.toISOString().slice(0, 10);

  return data.filter((point) =>
    point.date.length === 7
      ? point.date >= cutoffDate.slice(0, 7)
      : point.date >= cutoffDate,
  );
}

function hasValues(data: TrendPoint[], series: TrendSeries[]) {
  return data.some((point) =>
    series.some((item) => typeof point[item.key] === "number"),
  );
}

function formatNumber(value: number, precision: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: precision,
  }).format(value);
}

function formatAxisDate(value: string) {
  const dateValue = value.length === 7 ? `${value}-01` : value;

  const date = new Date(`${dateValue}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatTooltipDate(value: unknown) {
  if (typeof value !== "string") return String(value);

  if (value.length === 7) {
    const date = new Date(`${value}-01T00:00:00Z`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function TrendChart({
  data,
  series,
  unit,
  height = 380,
  allowRange = true,
  precision = 2,
}: {
  data: TrendPoint[];
  series: TrendSeries[];
  unit: string;
  height?: number;
  allowRange?: boolean;
  precision?: number;
}) {
  const [range, setRange] = useState<RangeId>("all");

  // Tracks which mandi is currently being hovered.
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  const sortedData = useMemo(
    () => [...data].sort((left, right) => left.date.localeCompare(right.date)),
    [data],
  );

  const filteredData = useMemo(
    () => filterRange(sortedData, range),
    [sortedData, range],
  );

  const availableRanges = useMemo(
    () =>
      rangeOptions.filter(([id]) =>
        hasValues(filterRange(sortedData, id), series),
      ),
    [sortedData, series],
  );

  const hasCurrentValues = hasValues(filteredData, series);

  // Only render the hovered mandi.
  // When nothing is hovered, display every mandi.
  const visibleSeries = series.some((item) => item.key === hoveredSeries)
    ? series.filter((item) => item.key === hoveredSeries)
    : series;

  if (!hasCurrentValues) return null;

  return (
    <div>
      {/* Date range filters */}
      {allowRange && (
        <fieldset className="mb-4 flex flex-wrap gap-2">
          <legend className="sr-only">Chart date range</legend>

          {availableRanges.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              aria-pressed={range === id}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                range === id
                  ? "border-[#D5BC7B]/60 bg-[#D5BC7B]/15 text-[#F6F1E5]"
                  : "border-[#D5BC7B]/20 text-[#E8E3D7]/70 hover:border-[#D5BC7B]/50"
              }`}
            >
              {label}
            </button>
          ))}
        </fieldset>
      )}

      {/* Graph */}
      <div>
        <div className="rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/45 p-4">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={filteredData}
              margin={{
                top: 12,
                right: 20,
                bottom: 8,
                left: 8,
              }}
            >
              <CartesianGrid
                stroke="#D5BC7B"
                strokeOpacity={0.12}
                vertical={false}
              />

              <XAxis
                dataKey="date"
                minTickGap={35}
                tickFormatter={(value: string) => formatAxisDate(value)}
                tick={{
                  fill: "#E8E3D7",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={{
                  stroke: "#D5BC7B",
                  strokeOpacity: 0.25,
                }}
              />

              <YAxis
                width={65}
                tickFormatter={(value: number) =>
                  formatNumber(value, precision)
                }
                tick={{
                  fill: "#E8E3D7",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />

              <Tooltip
                labelFormatter={(value) => formatTooltipDate(value)}
                contentStyle={{
                  backgroundColor: "#1B2820",
                  border: "1px solid rgba(213,188,123,.4)",
                  borderRadius: 12,
                  color: "#F6F1E5",
                  fontSize: 12,
                }}
                labelStyle={{
                  color: "#D5BC7B",
                }}
                formatter={(value) =>
                  typeof value === "number"
                    ? `${formatNumber(value, precision)} ${unit}`
                    : ""
                }
              />

              {/* Render only the selected mandi when hovering */}
              {visibleSeries.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={3}
                  dot={
                    filteredData.length < 30 ? { r: 4, strokeWidth: 1 } : false
                  }
                  activeDot={{
                    r: 6,
                    stroke: "#F6F1E5",
                    strokeWidth: 1.5,
                  }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Custom interactive mandi legend */}
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#D8C68F]">
            MARKET SELECTION
          </p>

          <p className="text-[10px] text-[#E8E3D7]/50">
            Hover to isolate a market
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {series.map((item) => {
            const isActive = hoveredSeries === item.key;
            const isDimmed = hoveredSeries !== null && !isActive;

            return (
              <button
                key={item.key}
                type="button"
                onMouseEnter={() => setHoveredSeries(item.key)}
                onMouseLeave={() => setHoveredSeries(null)}
                onFocus={() => setHoveredSeries(item.key)}
                onBlur={() => setHoveredSeries(null)}
                aria-label={`Show only ${item.label}`}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-all duration-150 ${
                  isActive
                    ? "border-[#D5BC7B]/60 bg-[#D5BC7B]/15 text-[#F6F1E5]"
                    : "border-[#D5BC7B]/10 bg-[#111B16]/50 text-[#E8E3D7]/75 hover:border-[#D5BC7B]/40 hover:bg-[#D5BC7B]/10"
                } ${isDimmed ? "opacity-35" : "opacity-100"}`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interaction hint */}
      <p className="mt-3 text-[11px] leading-5 text-[#E8E3D7]/60">
        {hoveredSeries
          ? `Showing only ${series.find((item) => item.key === hoveredSeries)?.label}. Move away to restore all markets.`
          : `Values shown in ${unit}. Hover over a market above to isolate its trend. Gaps are preserved; missing observations are not inferred.`}
      </p>
    </div>
  );
}
