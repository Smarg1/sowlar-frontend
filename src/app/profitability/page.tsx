import { BackendAnalysis } from "@component/field/BackendAnalysis";
import {
  EvidenceNote,
  FieldPage,
  formatNumber,
  Panel,
} from "@component/field/FieldUi";
import { MarketExplorer } from "@component/field/MarketExplorer";
import { ProfitScenario } from "@component/field/ProfitScenario";
import { fieldEvidence, getReference } from "@lib/data/field-evidence";
import { getAIShowcase, loadBackendResult } from "@lib/services/backend-api";
import { ChartNoAxesCombined } from "lucide-react";

type CropStatWithMetrics =
  (typeof fieldEvidence.agriculture.cropStatistics)[number] & {
    areaHa: number;
    yield: number;
  };

const latestYearStart = Math.max(
  0,
  ...fieldEvidence.agriculture.cropStatistics.map((item) =>
    Number.parseInt(item.year.slice(0, 4), 10),
  ),
);
const latestCropStats = fieldEvidence.agriculture.cropStatistics
  .filter(
    (item): item is CropStatWithMetrics =>
      Number.parseInt(item.year.slice(0, 4), 10) === latestYearStart &&
      item.areaHa !== null &&
      item.yield !== null,
  )
  .sort((left, right) => left.crop.localeCompare(right.crop));

const benchmarkRows = [
  {
    crop: "Wheat",
    gross: getReference("Wheat.benchmark_gross_crop_value_per_acre"),
    cost: getReference("Wheat.benchmark_A2_FL_cost_per_acre"),
    surplus: getReference("Wheat.benchmark_surplus_after_A2_FL_per_acre"),
  },
  {
    crop: "Maize",
    gross: getReference("Maize.benchmark_gross_crop_value_per_acre"),
    cost: getReference("Maize.benchmark_A2_FL_cost_per_acre"),
    surplus: getReference("Maize.benchmark_surplus_after_A2_FL_per_acre"),
  },
];
const availableBenchmarkRows = benchmarkRows.filter(
  (row) => row.gross || row.cost || row.surplus,
);

const bioNReference = getReference(
  "NITI.Chickpea.biological_N_fixed_reference",
);
const hasMarketPrices = fieldEvidence.agriculture.marketPrices.some(
  (record) => record.value !== null && Number.isFinite(record.value),
);
const hasMarketArrivals = fieldEvidence.agriculture.marketArrivals.some(
  (record) => record.value !== null && Number.isFinite(record.value),
);

export default async function ProfitabilityPage() {
  const backend = await loadBackendResult(getAIShowcase);

  return (
    <FieldPage
      eyebrow="Economics · Profitability"
      icon={ChartNoAxesCombined}
      title="Separate market evidence from farm returns"
      description="Explore reported AGMARKNET prices and arrivals, historical Jalandhar crop statistics, and public economic benchmarks. Farm-level profit is calculated only from values you enter."
    >
      <BackendAnalysis
        kind="profitability"
        result={backend.data?.profitability ?? null}
        error={backend.error}
      />

      {(hasMarketPrices || hasMarketArrivals) && (
        <Panel
          title="Mandi prices and market arrivals"
          eyebrow="AGMARKNET · Jalandhar market reports"
          description="Select a commodity to inspect the available monthly report records by market. Empty query coverage is kept distinct from zero trade."
        >
          <MarketExplorer />
          {hasMarketPrices && (
            <EvidenceNote source={fieldEvidence.sources.agmarknetPrices}>
              Prices are monthly wholesale report observations, not farm-gate
              offers. Reported arrivals indicate supply inflows, not consumer
              demand or sales to a particular farmer.
            </EvidenceNote>
          )}
          {hasMarketArrivals && (
            <EvidenceNote source={fieldEvidence.sources.agmarknetArrivals} />
          )}
        </Panel>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        {latestCropStats.length > 0 && (
          <Panel
            className="xl:col-span-7"
            title="District crop production history"
            eyebrow="DES Area, Production & Yield"
            description="The latest year shown is the last year available in the supplied Jalandhar extract. These are district aggregates, not field yields."
          >
            <div className="overflow-x-auto rounded-xl border border-[#D5BC7B]/15">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-[#D5BC7B]/[0.07] uppercase text-[#D8C68F]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Crop / group</th>
                    <th className="px-3 py-2 font-medium">Season</th>
                    <th className="px-3 py-2 font-medium">Agricultural year</th>
                    <th className="px-3 py-2 font-medium">Area (ha)</th>
                    <th className="px-3 py-2 font-medium">Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {latestCropStats.map((item) => (
                    <tr
                      key={`${item.crop}-${item.season}-${item.year}`}
                      className="border-t border-[#D5BC7B]/10"
                    >
                      <td className="px-3 py-2">{item.crop}</td>
                      <td className="px-3 py-2">{item.season}</td>
                      <td className="px-3 py-2">{item.year}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatNumber(item.areaHa)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatNumber(item.yield, 2)} {item.yieldUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <EvidenceNote source={fieldEvidence.sources.desApy}>
              Crop group names and production units follow the published
              district report; they should not be substituted for an individual
              farm estimate.
            </EvidenceNote>
          </Panel>
        )}

        {availableBenchmarkRows.length > 0 && (
          <Panel
            className="xl:col-span-5"
            title="Published economic benchmarks"
            eyebrow="PAU / public benchmark scenarios"
            description="Illustrative Punjab benchmark calculations from the supplied source file. Do not interpret these as actual farm profit or a guaranteed return."
          >
            <div className="space-y-3">
              {availableBenchmarkRows.map((row) => (
                <div
                  key={row.crop}
                  className="rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/65 p-3"
                >
                  <h3 className="text-sm font-semibold">{row.crop}</h3>
                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <BenchmarkValue
                      label="Gross value / acre"
                      reference={row.gross}
                    />
                    <BenchmarkValue
                      label="A2+FL cost / acre"
                      reference={row.cost}
                    />
                    <BenchmarkValue
                      label="Surplus after A2+FL"
                      reference={row.surplus}
                    />
                  </dl>
                  {row.surplus && (
                    <>
                      <p className="mt-2 text-xs leading-5 text-[#E8E3D7]/65">
                        {row.surplus.source_year} ·{" "}
                        {row.surplus.spatial_resolution_or_scope}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#E8E3D7]/65">
                        {row.surplus.interpretation_caveat}
                      </p>
                      <a
                        href={row.surplus.public_source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-[#D5BC7B] underline underline-offset-2"
                      >
                        Benchmark methodology and source
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#E8E3D7]/65">
              Historical cost/revenue benchmarks are not market forecasts and
              may omit costs or conditions that matter to an individual farm.
            </p>
          </Panel>
        )}
      </div>

      <Panel
        title="Your farm scenario"
        eyebrow="Farmer-entered assumptions"
        description="Use a known field area, expected yield, expected sale price, and total per-acre input cost to estimate a simple gross and net scenario."
      >
        <ProfitScenario />
      </Panel>

      {bioNReference && (
        <Panel
          title="Biological nitrogen reference"
          eyebrow="NITI Aayog · chickpea"
          description="The supplied public reference lists biological nitrogen fixation for chickpea; it is not measured nitrogen retained in this field or a direct fertilizer saving."
        >
          <div className="rounded-xl border border-[#A3B5A0]/15 bg-[#29332D]/40 p-4">
            <p className="text-2xl font-semibold tabular-nums">
              {bioNReference.value}{" "}
              <span className="text-sm font-normal text-[#D5BC7B]">
                {bioNReference.unit}
              </span>
            </p>
            <p className="mt-2 text-sm leading-6 text-[#E8E3D7]/80">
              Nitrogen fixation depends on compatible rhizobia, crop growth,
              soil, water, and residue handling. The theoretical urea-product
              equivalent in the reference is not an actual saved input or cash
              benefit.
            </p>
          </div>
          <EvidenceNote
            source={{
              dataset: bioNReference.category,
              coverage: bioNReference.source_year || "Published reference",
              resolution: bioNReference.reference_geography,
              url: bioNReference.public_source_url,
            }}
          >
            Use a local soil test and fertilizer recommendation; do not subtract
            the published nitrogen value from the farmer&apos;s urea bill.
          </EvidenceNote>
        </Panel>
      )}
    </FieldPage>
  );
}

function BenchmarkValue({
  label,
  reference,
}: {
  label: string;
  reference: (typeof benchmarkRows)[number]["gross"];
}) {
  if (!reference) {
    return null;
  }

  return (
    <div>
      <dt className="leading-4 text-[#A3B5A0]">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums">
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(reference.value))}
      </dd>
    </div>
  );
}
