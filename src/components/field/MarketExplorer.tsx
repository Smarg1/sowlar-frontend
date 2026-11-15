"use client";

import { fieldEvidence, hasNumericValue } from "@lib/data/field-evidence";
import { BarChart3, Store, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { TrendChart, type TrendPoint, type TrendSeries } from "./TrendChart";

const colors = [
  "#D5BC7B",
  "#A3B5A0",
  "#E8E3D7",
  "#718675",
  "#C9D4C4",
  "#D3B68C",
  "#83A8A0",
];

const coverageIcons = [BarChart3, TrendingUp, Store];

function toMarketChart(
  records: Array<{
    period: string;
    commodity: string;
    market: string;
    value: number | null;
  }>,
  commodity: string,
) {
  const selected = records
    .filter((record) => record.commodity === commodity)
    .filter(hasNumericValue);
  const markets = [...new Set(selected.map((record) => record.market))].sort();
  const periods = [...new Set(selected.map((record) => record.period))].sort();
  const data: TrendPoint[] = periods.map((period) => {
    const point: TrendPoint = { date: period };
    for (const record of selected) {
      if (record.period === period && record.value !== null) {
        point[record.market] = record.value;
      }
    }
    return point;
  });
  const series: TrendSeries[] = markets.map((market, index) => ({
    key: market,
    label: market,
    color: colors[index % colors.length] ?? "#D5BC7B",
  }));
  return { data, series, selected };
}

export function MarketExplorer() {
  const [commodity, setCommodity] = useState("Wheat");
  const { priceData, priceSeries, prices } = useMemo(() => {
    const result = toMarketChart(
      fieldEvidence.agriculture.marketPrices,
      commodity,
    );
    return {
      priceData: result.data,
      priceSeries: result.series,
      prices: result.selected,
    };
  }, [commodity]);
  const { arrivalData, arrivalSeries } = useMemo(() => {
    const result = toMarketChart(
      fieldEvidence.agriculture.marketArrivals,
      commodity,
    );
    return {
      arrivalData: result.data,
      arrivalSeries: result.series,
    };
  }, [commodity]);
  const coverage = fieldEvidence.agriculture.marketCoverage.find(
    (record) => record.commodity === commodity,
  );
  const coverageMetrics = [
    { label: "Price observations", value: coverage?.priceObservations ?? 0 },
    {
      label: "Arrival observations",
      value: coverage?.arrivalObservations ?? 0,
    },
    { label: "Markets with records", value: coverage?.marketsWithRecords ?? 0 },
  ].filter((item) => item.value > 0);
  const latestPrices = [...prices]
    .sort((left, right) => right.period.localeCompare(left.period))
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <label className="block max-w-sm text-sm text-[#E8E3D7]/85">
        Commodity
        <select
          value={commodity}
          onChange={(event) => setCommodity(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#D5BC7B]/20 bg-[#111B16] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
        >
          {fieldEvidence.agriculture.marketCoverage.map((record) => (
            <option key={record.commodity} value={record.commodity}>
              {record.commodity}
            </option>
          ))}
        </select>
      </label>

      {coverageMetrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {coverageMetrics.map((item, index) => {
            const Icon =
              coverageIcons[index % coverageIcons.length] ?? BarChart3;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-[#D8C68F]">
                    {item.label}
                  </p>
                  <Icon aria-hidden="true" className="h-4 w-4 text-[#D5BC7B]" />
                </div>
                <p className="mt-1 text-lg font-semibold tabular-nums text-[#F6F1E5]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {(priceData.length > 0 || arrivalData.length > 0) && (
        <div className="space-y-5">
          {priceData.length > 0 && (
            <section className="w-full rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/55 p-4 sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#F6F1E5]">
                <TrendingUp
                  aria-hidden="true"
                  className="h-4 w-4 text-[#D5BC7B]"
                />
                Reported wholesale prices
              </h3>
              <TrendChart
                data={priceData}
                series={priceSeries}
                unit="INR per quintal"
                height={380}
                precision={0}
              />
            </section>
          )}
          {arrivalData.length > 0 && (
            <section className="rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/55 p-3 sm:p-4 xl:col-span-5">
              <h3 className="w-full rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/55 p-4 sm:p-5">
                <Store aria-hidden="true" className="h-4 w-4 text-[#D5BC7B]" />
                Reported market arrivals
              </h3>
              <TrendChart
                data={arrivalData}
                series={arrivalSeries}
                unit="metric tonnes (monthly report convention)"
                height={380}
                precision={1}
              />
            </section>
          )}
        </div>
      )}

      {latestPrices.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/55">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[#D5BC7B]/[0.07] text-xs uppercase text-[#D8C68F]">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Reported price</th>
                <th className="px-3 py-2 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {latestPrices.map((record) => (
                <tr
                  key={`${record.period}-${record.market}`}
                  className="border-t border-[#D5BC7B]/10"
                >
                  <td className="px-3 py-2 tabular-nums">{record.period}</td>
                  <td className="px-3 py-2">{record.market}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {record.value.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 text-[#E7E8DF]/65">
                    INR per quintal
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
