import { Details } from "@component/Details";
import { BackendAnalysis } from "@component/field/BackendAnalysis";
import { formatDate, formatNumber } from "@component/field/FieldUi";
import {
  fieldEvidence,
  getReferencesByCategory,
  hasNumericValue,
} from "@lib/data/field-evidence";
import { latestNumber } from "@lib/data/field-metrics";
import { getAIShowcase, loadBackendResult } from "@lib/services/backend-api";
import {
  ArrowUpRight,
  CloudRain,
  Droplets,
  Layers,
  type LucideIcon,
  MapPinned,
  Mountain,
  RefreshCw,
  Satellite,
  ScanLine,
  ShieldAlert,
  Sprout,
  Store,
  Sun,
  ThermometerSun,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const dashboardCardClass =
  "group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#D5BC7B]/20 bg-[#1D2922]/92 p-4 text-[#F6F1E5] shadow-[0_8px_32px_0_rgba(18,26,21,0.55)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#D5BC7B]/40";

const dashboardTileClass =
  "group flex h-full min-h-28 flex-col justify-between rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/85 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D5BC7B]/40 hover:bg-[#26342B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5BC7B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D2922]";

// Latest satellite and field observations
const moisture = latestNumber(
  fieldEvidence.observations.smap,
  (item) => item.date,
  (item) => item.rootZone,
);

const temperature = latestNumber(
  fieldEvidence.observations.landsat,
  (item) => item.date,
  (item) => item.surfaceTempC,
);

const vegetation = latestNumber(
  fieldEvidence.observations.modis,
  (item) => item.date,
  (item) => item.ndvi,
);

const storage = latestNumber(
  fieldEvidence.observations.gracefo,
  (item) => item.date,
  (item) => item.anomalyCm,
);

// Prefer the wheat market with the most observations so the dashboard can
// show a useful price trend.
const validMarketPrices = [...fieldEvidence.agriculture.marketPrices].filter(
  hasNumericValue,
);
const wheatPriceSeries = [
  ...new Set(
    validMarketPrices
      .filter((record) => record.commodity === "Wheat")
      .map((record) => record.market),
  ),
]
  .map((market) =>
    validMarketPrices
      .filter(
        (record) => record.commodity === "Wheat" && record.market === market,
      )
      .sort((left, right) => left.period.localeCompare(right.period)),
  )
  .sort(
    (left, right) =>
      right.length - left.length ||
      (right[right.length - 1]?.period ?? "").localeCompare(
        left[left.length - 1]?.period ?? "",
      ),
  );

const selectedWheatPriceSeries = wheatPriceSeries[0] ?? [];

const latestMarketPrice =
  selectedWheatPriceSeries[selectedWheatPriceSeries.length - 1] ??
  validMarketPrices.sort((left, right) =>
    right.period.localeCompare(left.period),
  )[0];

const validMarketArrivals = [
  ...fieldEvidence.agriculture.marketArrivals,
].filter(hasNumericValue);
const latestMarketArrival = latestMarketPrice
  ? (validMarketArrivals
      .filter(
        (record) =>
          record.commodity === latestMarketPrice.commodity &&
          record.market === latestMarketPrice.market,
      )
      .sort((left, right) => right.period.localeCompare(left.period))[0] ??
    validMarketArrivals
      .filter((record) => record.commodity === latestMarketPrice.commodity)
      .sort((left, right) => right.period.localeCompare(left.period))[0])
  : validMarketArrivals.sort((left, right) =>
      right.period.localeCompare(left.period),
    )[0];

// Six latest available prices for the same commodity and mandi
const marketPriceTrend = latestMarketPrice
  ? [...fieldEvidence.agriculture.marketPrices]
      .filter(
        (record) =>
          record.commodity === latestMarketPrice.commodity &&
          record.market === latestMarketPrice.market,
      )
      .filter(hasNumericValue)
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-6)
  : [];

// Compare arrivals for the same commodity and reporting period
const latestArrivalMarkets = latestMarketArrival
  ? [...fieldEvidence.agriculture.marketArrivals]
      .filter(
        (record) =>
          record.commodity === latestMarketArrival.commodity &&
          record.period === latestMarketArrival.period,
      )
      .filter(hasNumericValue)
      .sort((a, b) => b.value - a.value)
  : [];

const topArrivalMarkets = latestArrivalMarkets.slice(0, 3);

const reportingMarketCount = new Set(
  latestArrivalMarkets.map((record) => record.market),
).size;

const latestPriceObservationCount = latestMarketPrice
  ? fieldEvidence.agriculture.marketPrices
      .filter(
        (record) =>
          record.commodity === latestMarketPrice.commodity &&
          record.period === latestMarketPrice.period,
      )
      .filter(hasNumericValue).length
  : 0;

// Published crop rotation references
const rotationReferences = getReferencesByCategory(
  "PUBLIC_ROTATION_REFERENCE",
).slice(0, 3);

const practiceReference = getReferencesByCategory(
  "PUBLIC_CROP_PRACTICE_REFERENCE",
)[0];

const nitrogenReference = getReferencesByCategory(
  "PUBLIC_BIO_N_REFERENCE",
).find((reference) =>
  reference.metric.includes("Five-pulse average.biological_N_fixed_reference"),
);

// Observed field indicators
const observedIndicators: Array<{
  label: string;
  value: string;
  source: string;
  date?: string;
  Icon: LucideIcon;
}> = [];

if (moisture?.rootZone !== null && moisture !== undefined) {
  observedIndicators.push({
    label: "Root-zone moisture",
    value: `${formatNumber(moisture.rootZone * 100)}%`,
    source: "SMAP L4",
    date: moisture.date,
    Icon: Droplets,
  });
}

if (temperature?.surfaceTempC !== null && temperature !== undefined) {
  observedIndicators.push({
    label: "Surface temperature",
    value: `${formatNumber(temperature.surfaceTempC)}°C`,
    source: "Landsat",
    date: temperature.date,
    Icon: ThermometerSun,
  });
}

if (vegetation?.ndvi !== null && vegetation !== undefined) {
  observedIndicators.push({
    label: "Vegetation index",
    value: formatNumber(vegetation.ndvi, 3),
    source: "MODIS NDVI",
    date: vegetation.date,
    Icon: Sprout,
  });
}

const bareSoilIndex = latestNumber(
  fieldEvidence.observations.sentinel2,
  (item) => item.date,
  (item) => item.bsi,
);

if (bareSoilIndex?.bsi !== null && bareSoilIndex !== undefined) {
  observedIndicators.push({
    label: "Bare-soil index",
    value: formatNumber(bareSoilIndex.bsi, 3),
    source: "Sentinel-2",
    date: bareSoilIndex.date,
    Icon: ScanLine,
  });
}

if (fieldEvidence.observations.terrain.slopeDegrees !== null) {
  observedIndicators.push({
    label: "Mean terrain slope",
    value: `${formatNumber(fieldEvidence.observations.terrain.slopeDegrees, 2)}°`,
    source: "SRTM",
    Icon: Mountain,
  });
}

if (storage?.anomalyCm !== null && storage !== undefined) {
  observedIndicators.push({
    label: "Regional water-storage anomaly",
    value: `${formatNumber(storage.anomalyCm)} cm`,
    source: "GRACE-FO",
    date: storage.date,
    Icon: Layers,
  });
}

const failureRiskIndicators: Array<{
  label: string;
  value: string;
  source: string;
}> = [];

if (moisture?.rootZone !== null && moisture !== undefined) {
  failureRiskIndicators.push({
    label: "Root moisture",
    value: `${formatNumber(moisture.rootZone * 100)}%`,
    source: "SMAP",
  });
}

if (temperature?.surfaceTempC !== null && temperature !== undefined) {
  failureRiskIndicators.push({
    label: "Surface temp",
    value: `${formatNumber(temperature.surfaceTempC)}°C`,
    source: "Landsat",
  });
}

if (vegetation?.ndvi !== null && vegetation !== undefined) {
  failureRiskIndicators.push({
    label: "Vegetation NDVI",
    value: formatNumber(vegetation.ndvi, 3),
    source: "MODIS",
  });
}

// Climate observations
const climateObservations: Array<{
  label: string;
  value: string;
  source: string;
  date: string;
  Icon: typeof ThermometerSun;
}> = [];

const latestPowerMaximum = latestNumber(
  fieldEvidence.observations.nasaPower,
  (item) => item.date,
  (item) => item.maxTempC,
);

const latestPowerMinimum = latestNumber(
  fieldEvidence.observations.nasaPower,
  (item) => item.date,
  (item) => item.minTempC,
);

const latestRainfall = latestNumber(
  fieldEvidence.observations.rainfall,
  (item) => item.date,
  (item) => item.mm,
);

if (latestPowerMaximum?.maxTempC !== null && latestPowerMaximum !== undefined) {
  climateObservations.push({
    label: "Daily high",
    value: `${formatNumber(latestPowerMaximum.maxTempC)}°C`,
    source: "NASA POWER",
    date: latestPowerMaximum.date,
    Icon: ThermometerSun,
  });
}

if (latestPowerMinimum?.minTempC !== null && latestPowerMinimum !== undefined) {
  climateObservations.push({
    label: "Daily low",
    value: `${formatNumber(latestPowerMinimum.minTempC)}°C`,
    source: "NASA POWER",
    date: latestPowerMinimum.date,
    Icon: Sun,
  });
}

if (latestRainfall?.mm !== null && latestRainfall !== undefined) {
  climateObservations.push({
    label: "Daily rainfall",
    value: `${formatNumber(latestRainfall.mm)} mm`,
    source: "GPM IMERG",
    date: latestRainfall.date,
    Icon: CloudRain,
  });
}

// Compact wholesale price sparkline
function PriceSparkline({
  observations,
}: {
  observations: Array<{ period: string; value: number }>;
}) {
  if (observations.length < 2) {
    return null;
  }

  const width = 320;
  const height = 76;
  const padding = 8;

  const values = observations.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;

  const points = observations.map((item, index) => ({
    x: padding + (index / (observations.length - 1)) * (width - padding * 2),
    y:
      height - padding - ((item.value - min) / spread) * (height - padding * 2),
  }));

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-19 w-full overflow-visible"
        role="img"
        aria-label={`Wholesale price trend from ${observations[0]?.period} to ${observations[observations.length - 1]?.period}`}
      >
        {[20, 40, 60].map((y) => (
          <line
            key={y}
            x1="0"
            x2={width}
            y1={y}
            y2={y}
            stroke="#D5BC7B"
            strokeOpacity="0.12"
            strokeDasharray="3 4"
          />
        ))}

        <path
          d={path}
          fill="none"
          stroke="#D5BC7B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <circle
            key={observations[index]?.period}
            cx={point.x}
            cy={point.y}
            r="3.5"
            fill="#D5BC7B"
            stroke="#1D2922"
            strokeWidth="1.5"
            aria-label={`${observations[index]?.period}: ₹${formatNumber(observations[index]?.value ?? 0)}`}
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-[#E7E8DF]/50">
        <span>{observations[0]?.period}</span>
        <span>{observations[observations.length - 1]?.period}</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const backend = await loadBackendResult(getAIShowcase);
  const coordinates: [string, string] = [
    `${fieldEvidence.location.latitude.toFixed(5)}° N`,
    `${fieldEvidence.location.longitude.toFixed(5)}° E`,
  ];

  return (
    <main className="relative min-h-[calc(100vh-4rem)] w-full md:flex-1">
      <div className="relative z-10 mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-8 md:auto-rows-[minmax(165px,auto)] lg:grid-cols-12 lg:auto-rows-[minmax(170px,auto)] xl:gap-5 xl:p-6">
        {/* LOCATION DETAILS */}
        <section
          id="card-1-land-details"
          className="min-h-45 sm:col-span-2 md:col-span-4 lg:col-start-1 lg:col-span-4 lg:row-start-1"
        >
          <Link
            href="/vulnerability"
            aria-label="Explore field conditions for Jalandhar"
            className="group flex h-full flex-col justify-center rounded-3xl transition hover:bg-[#1F2923]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3B5A0]"
          >
            <Details
              name={fieldEvidence.location.district}
              location={`${fieldEvidence.location.state}, India`}
              coordinates={coordinates}
            />

            <span className="mx-6 -mt-1 flex items-center gap-2 text-sm font-medium text-[#A3B5A0] opacity-80 transition group-hover:opacity-100">
              <MapPinned aria-hidden="true" className="h-4 w-4" />
              Open field conditions
              <ArrowUpRight aria-hidden="true" className="ml-auto h-4 w-4" />
            </span>
          </Link>
        </section>

        {/* CROP ROTATION */}
        {rotationReferences.length > 0 && (
          <section
            id="card-2-crop-rotation-center"
            className="flex min-h-112 flex-col rounded-3xl sm:col-span-2 md:col-span-4 md:row-span-2 lg:col-start-5 lg:col-span-5 lg:row-start-1 lg:row-span-2"
          >
            <div className={dashboardCardClass}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#F7F6F0]/35 to-transparent"
              />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3B5A0]">
                    <RefreshCw className="h-3 w-3 transition-transform duration-500 group-hover:rotate-45 motion-safe:animate-pulse" />
                    Published Punjab references
                  </span>

                  <h2 className="mt-1 text-lg font-medium tracking-tight">
                    Crop Rotation Options
                  </h2>
                </div>

                <Link
                  href="/rotation"
                  aria-label="Explore crop rotation options"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#A3B5A0]/30 bg-[#17211B]/85 transition hover:bg-[#F7F6F0] hover:text-[#34483A]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {(rotationReferences.length > 0 ||
                nitrogenReference ||
                practiceReference) && (
                <div className="mt-3 grid flex-1 auto-rows-fr gap-3 border-t border-[#A3B5A0]/20 pt-3 sm:grid-cols-2">
                  <div className="grid min-h-0 gap-3 sm:grid-rows-2">
                    {nitrogenReference && (
                      <Link
                        href="/rotation"
                        aria-label="Learn how nitrogen-fixing crops support crop rotations"
                        className={dashboardTileClass}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-medium text-[#A3B5A0]">
                          <Sprout className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-125 motion-safe:animate-pulse" />
                          Nitrogen-fixing crops
                        </p>

                        <p className="mt-1 text-sm leading-5 text-[#E7E8DF]/75">
                          Pulses can fix atmospheric nitrogen; the amount and
                          benefit to a following crop depend on local
                          conditions.
                        </p>

                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-2 h-4 w-4 self-end text-[#A3B5A0]"
                        />
                      </Link>
                    )}

                    {practiceReference && (
                      <Link
                        href="/rotation"
                        aria-label="View low-tillage practice guidance"
                        className={dashboardTileClass}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-medium text-[#A3B5A0]">
                          <Layers className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125 motion-safe:animate-pulse" />
                          Low-tillage reference
                        </p>

                        <p className="mt-1 text-sm leading-5 text-[#E7E8DF]/75">
                          Direct-sown wheat with a Super Seeder is described for
                          maize-residue conditions.
                        </p>

                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-2 h-4 w-4 self-end text-[#A3B5A0]"
                        />
                      </Link>
                    )}
                  </div>

                  <div className="grid min-h-0 gap-3 sm:grid-rows-3">
                    {[
                      ...rotationReferences.slice(1),
                      ...rotationReferences.slice(0, 1),
                    ].map((reference) => (
                      <Link
                        key={reference.metric}
                        href="/rotation"
                        aria-label={`Compare the ${reference.value.replace(/ rotation sequence$/i, "")} rotation`}
                        className={dashboardTileClass}
                      >
                        <p className="text-sm font-medium leading-5">
                          {reference.value.replace(/ rotation sequence$/i, "")}
                        </p>

                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-2 h-4 w-4 self-end text-[#A3B5A0] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-3 text-[11px] leading-5 text-[#E7E8DF]/55">
                Published examples are references, not field-specific
                predictions. Confirm crop history, water, equipment, and buyer
                access with local experts.
              </p>
            </div>
          </section>
        )}

        {/* SATELLITE AND FIELD INDICATORS */}
        {observedIndicators.length > 0 && (
          <section
            id="card-3-observed-indicators"
            className="flex min-h-112 flex-col rounded-3xl sm:col-span-2 md:col-span-4 md:row-span-2 lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-2"
          >
            <div className={dashboardCardClass}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#F7F6F0]/35 to-transparent"
              />

              <div className="flex items-start justify-between gap-2 border-b border-[#A3B5A0]/20 pb-2">
                <div>
                  <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3B5A0]">
                    Satellite and regional observations
                  </span>

                  <h2 className="mt-1 text-lg font-medium tracking-tight">
                    Field Indicators
                  </h2>
                </div>

                <Satellite
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-[#A3B5A0] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 motion-safe:animate-pulse"
                />

                <Link
                  href="/vulnerability"
                  aria-label="Open observed field indicators"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#A3B5A0]/30 bg-[#17211B]/85 transition hover:bg-[#F7F6F0] hover:text-[#34483A]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3 grid flex-1 auto-rows-fr grid-cols-2 gap-3">
                {observedIndicators.map((indicator) => (
                  <Link
                    key={indicator.label}
                    href="/vulnerability"
                    aria-label={`View ${indicator.label} history and context`}
                    className={dashboardTileClass}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-mono text-[11px] uppercase leading-4 text-[#A3B5A0]">
                        {indicator.label}
                      </p>

                      <indicator.Icon
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-[#A3B5A0] transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6"
                      />
                    </div>

                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {indicator.value}
                    </p>

                    <p className="mt-1 text-[11px] text-[#E7E8DF]/60">
                      {indicator.date
                        ? `${indicator.source} · ${formatDate(indicator.date)}`
                        : indicator.source}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* MANDI PRICE & ARRIVALS */}
        {(latestMarketPrice || latestMarketArrival) && (
          <section
            id="card-5-apmc-market"
            className="flex min-h-88 flex-col rounded-3xl sm:col-span-2 md:col-span-4 md:row-span-2 lg:col-start-1 lg:col-span-4 lg:row-start-2 lg:row-span-2"
          >
            <div className={dashboardCardClass}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#F7F6F0]/35 to-transparent"
              />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[#A3B5A0]/20 pb-3">
                <div>
                  <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3B5A0]">
                    AGMARKNET · Jalandhar reports
                  </span>

                  <h2 className="mt-1 text-lg font-medium tracking-tight">
                    Mandi Price & Arrivals
                  </h2>
                </div>

                <Link
                  href="/profitability"
                  aria-label="Open market intelligence"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#A3B5A0]/30 bg-[#17211B]/85 transition hover:bg-[#F7F6F0] hover:text-[#34483A]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                {latestMarketPrice && (
                  <Link
                    href="/profitability"
                    aria-label={`View reported wholesale prices for ${latestMarketPrice.commodity}`}
                    className={`${dashboardTileClass} min-w-0`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#A3B5A0]">
                      Wholesale price
                    </p>

                    <p className="mt-2 text-xl font-semibold tabular-nums">
                      ₹{latestMarketPrice.value.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-[11px] text-[#A3B5A0]">
                      INR / quintal
                    </p>

                    <p className="mt-2 text-[11px] leading-4 text-[#E7E8DF]/70">
                      {latestMarketPrice.commodity} · {latestMarketPrice.market}
                    </p>
                  </Link>
                )}

                {latestMarketArrival && (
                  <Link
                    href="/profitability"
                    aria-label={`View reported market arrivals for ${latestMarketArrival.commodity}`}
                    className={`${dashboardTileClass} min-w-0`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#A3B5A0]">
                      Reported arrivals
                    </p>

                    <p className="mt-2 text-xl font-semibold tabular-nums">
                      {formatNumber(latestMarketArrival.value)}
                    </p>

                    <p className="mt-1 text-[11px] text-[#A3B5A0]">
                      Metric tonnes
                    </p>

                    <p className="mt-2 text-[11px] leading-4 text-[#E7E8DF]/70">
                      {latestMarketArrival.commodity} ·{" "}
                      {latestMarketArrival.market}
                    </p>
                  </Link>
                )}
              </div>

              {/* Wholesale Price Trend */}
              {latestMarketPrice && (
                <div className="border-t border-[#A3B5A0]/20 pt-3 mt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#A3B5A0]">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Price trend
                    </p>

                    <span className="text-[11px] text-[#E7E8DF]/50">
                      Latest 6 observations
                    </span>
                  </div>

                  <PriceSparkline observations={marketPriceTrend} />

                  <p className="mt-2 text-[11px] text-[#E7E8DF]/60">
                    {latestMarketPrice.market} · {latestMarketPrice.commodity}
                  </p>
                </div>
              )}

              {/* Top Reporting Mandis */}
              {topArrivalMarkets.length > 0 && (
                <div className="border-t border-[#A3B5A0]/20 pt-3 mt-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#A3B5A0]">
                      <Store className="h-3.5 w-3.5" />
                      Top reporting mandis
                    </p>

                    <span className="text-[11px] text-[#E7E8DF]/50">
                      {latestMarketArrival?.period}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topArrivalMarkets.map((market, index) => {
                      const maxArrival = topArrivalMarkets[0]?.value ?? 1;

                      const percentage =
                        maxArrival > 0 ? (market.value / maxArrival) * 100 : 0;

                      return (
                        <div key={`${market.market}-${market.period}`}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-[11px] text-[#E7E8DF]/85">
                              <span className="mr-1.5 text-[#A3B5A0]">
                                {index + 1}.
                              </span>

                              {market.market}
                            </span>

                            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#F6F1E5]">
                              {formatNumber(market.value)} t
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-[#A3B5A0]/10">
                            <div
                              className="h-full rounded-full bg-[#A3B5A0] transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reporting Coverage */}
              <div className="border-t border-[#A3B5A0]/20 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#A3B5A0]">
                      Markets reporting
                    </p>

                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {reportingMarketCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#A3B5A0]">
                      Price observations
                    </p>

                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {latestPriceObservationCount}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#E7E8DF]/55">
                  <span>
                    Monthly market-level reports · Not farm-gate prices
                  </span>

                  <a
                    href={fieldEvidence.sources.agmarknetPrices.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[#A3B5A0] underline underline-offset-2"
                  >
                    Source
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CLIMATE CONTEXT */}
        {climateObservations.length > 0 && (
          <section
            id="card-6-climate-observations"
            className="flex min-h-60 flex-col rounded-3xl sm:col-span-2 md:col-span-4 lg:col-start-5 lg:col-span-4 lg:row-start-3"
          >
            <div className={dashboardCardClass}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#F7F6F0]/35 to-transparent"
              />

              <div className="flex items-start justify-between gap-3 border-b border-[#A3B5A0]/20 pb-2">
                <div>
                  <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3B5A0]">
                    Recent public observations
                  </span>

                  <h2 className="mt-1 text-lg font-medium tracking-tight">
                    Climate Context
                  </h2>
                </div>

                <Link
                  href="/vulnerability"
                  aria-label="Explore climate trends"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#A3B5A0]/30 bg-[#17211B]/85 transition hover:bg-[#F7F6F0] hover:text-[#34483A]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3 grid flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-3">
                {climateObservations.map(({ Icon, ...observation }) => (
                  <Link
                    key={observation.label}
                    href="/vulnerability"
                    aria-label={`View ${observation.label.toLowerCase()} trends`}
                    className={dashboardTileClass}
                  >
                    <p className="flex items-center gap-1 font-mono text-[11px] uppercase text-[#A3B5A0]">
                      <Icon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-125 motion-safe:animate-pulse" />
                      {observation.label}
                    </p>

                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {observation.value}
                    </p>

                    <p className="mt-0.5 text-[11px] text-[#E7E8DF]/60">
                      {observation.source} · {formatDate(observation.date)}
                    </p>

                    <ArrowUpRight
                      aria-hidden="true"
                      className="mt-2 h-4 w-4 self-end text-[#A3B5A0] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>
                ))}
              </div>

              <p className="mt-3 text-[11px] leading-4 text-[#E7E8DF]/55">
                Gridded daily readings, not a local weather-station forecast.
              </p>
            </div>
          </section>
        )}

        {/* CROP STRESS AND FAILURE RISK */}
        <section
          id="card-7-failure-risk"
          className="min-h-72 sm:col-span-2 md:col-span-4 lg:col-start-9 lg:col-span-4 lg:row-start-3"
        >
          <Link
            href="/failure"
            aria-label="Review crop failure stress signals"
            className={`${dashboardCardClass} gap-3`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#A3B5A0]/25 bg-[#17211B]/85 text-[#A3B5A0]">
                <ShieldAlert className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 motion-safe:animate-pulse" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#A3B5A0]">
                  Decision support
                </p>

                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Crop Stress & Failure Risk
                </h2>
              </div>

              <ArrowUpRight className="h-5 w-5 shrink-0 text-[#A3B5A0] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>

            <div className="mt-auto grid grid-cols-3 gap-3">
              {failureRiskIndicators.map((indicator) => (
                <div
                  key={indicator.label}
                  className="min-h-28 min-w-0 rounded-2xl border border-[#D5BC7B]/15 bg-[#111B16]/85 p-3"
                >
                  <p className="truncate font-mono text-[11px] uppercase tracking-wide text-[#A3B5A0]">
                    {indicator.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {indicator.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#E7E8DF]/60">
                    {indicator.source}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        </section>

        <section
          id="card-8-backend-analysis"
          className="sm:col-span-2 md:col-span-8 lg:col-span-12"
        >
          <BackendAnalysis
            kind="showcase"
            result={backend.data}
            error={backend.error}
          />
        </section>
      </div>
    </main>
  );
}
