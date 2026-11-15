"use client";

import {
  fieldEvidence,
  getCropWaterRange,
  getReferencesByCategory,
} from "@lib/data/field-evidence";
import { Leaf, Sprout, Wheat } from "lucide-react";
import { useMemo, useState } from "react";

type Priority = "water" | "soil" | "market";
type Candidate = {
  id: string;
  sequence: string;
  reference: (typeof fieldEvidence.agriculture.publicReferences)[number];
  legume: boolean;
  marketObservations: number;
  localCrops: string[];
  waterRange: {
    minimum: number;
    maximum: number;
    unit: string;
    caveat: string;
    sourceUrl: string;
  } | null;
  seederReference: boolean;
};

function referenceCropForName(name: string) {
  const crop = name.trim().toLowerCase();
  if (/rice|paddy/.test(crop)) return "Rice (paddy)";
  if (/wheat/.test(crop)) return "Wheat";
  if (/maize/.test(crop)) return "Maize";
  if (/cotton/.test(crop)) return "Cotton";
  if (/groundnut|peanut/.test(crop)) return "Groundnut/peanut";
  if (/millet|sorghum/.test(crop)) return "Sorghum/Millet";
  if (/soybean/.test(crop)) return "Soybean";
  if (/sunflower/.test(crop)) return "Sunflower";
  if (/moong|mash|arhar|pulse|gram|chickpea/.test(crop)) {
    return "Bean (generic pulse proxy)";
  }
  return null;
}

function sequenceWaterRange(sequence: string) {
  const parts = sequence.split("-");
  let minimum = 0;
  let maximum = 0;
  const caveats: string[] = [];
  let sourceUrl = "";

  for (const part of parts) {
    const alternatives = part
      .split("/")
      .map(referenceCropForName)
      .filter(
        (crop): crop is NonNullable<ReturnType<typeof referenceCropForName>> =>
          crop !== null,
      );
    const uniqueCrops = [...new Set(alternatives)];
    const crop = uniqueCrops[0];

    if (uniqueCrops.length !== 1 || alternatives.length === 0 || !crop) {
      return null;
    }

    const range = getCropWaterRange(crop);
    if (!range) {
      return null;
    }
    minimum += range.minimum;
    maximum += range.maximum;
    caveats.push(range.caveat);
    sourceUrl = range.sourceUrl;
  }

  return {
    minimum,
    maximum,
    unit: "mm per crop growing period (reference sum)",
    caveat: [...new Set(caveats)].join(" "),
    sourceUrl,
  };
}

function candidateHasCommodity(sequence: string, commodity: string) {
  const name = sequence.toLowerCase();
  if (commodity === "Paddy") return /rice|paddy/.test(name);
  if (commodity === "Wheat") return name.includes("wheat");
  if (commodity === "Maize") return name.includes("maize");
  return true;
}

function buildCandidates(): Candidate[] {
  const rotationReferences = getReferencesByCategory(
    "PUBLIC_ROTATION_REFERENCE",
  );
  const seederReference = getReferencesByCategory(
    "PUBLIC_CROP_PRACTICE_REFERENCE",
  )[0];

  return rotationReferences.map((reference) => {
    const sequence = reference.value.replace(/ rotation sequence$/i, "");
    const marketObservations = fieldEvidence.agriculture.marketPrices.filter(
      (record) =>
        record.value !== null &&
        ((/rice|paddy/i.test(sequence) && /paddy/i.test(record.commodity)) ||
          (/wheat/i.test(sequence) && /wheat/i.test(record.commodity)) ||
          (/maize/i.test(sequence) && /maize/i.test(record.commodity))),
    ).length;
    const localCrops = [
      ...new Set(
        fieldEvidence.agriculture.cropStatistics
          .filter((row) => {
            const cropName = row.crop.toLowerCase();
            return (
              (/wheat/.test(sequence.toLowerCase()) &&
                /wheat/.test(cropName)) ||
              (/maize/.test(sequence.toLowerCase()) &&
                /maize/.test(cropName)) ||
              (/rice|paddy/.test(sequence.toLowerCase()) &&
                /paddy|rice/.test(cropName)) ||
              (/arhar|moong|mash/.test(sequence.toLowerCase()) &&
                /arhar|tur|pulse|gram|beans/.test(cropName))
            );
          })
          .map((row) => row.crop),
      ),
    ];

    return {
      id: reference.metric,
      sequence,
      reference,
      legume: /moong|mash|arhar|groundnut|chickpea|pulse|gram|bean/i.test(
        sequence,
      ),
      marketObservations,
      localCrops,
      waterRange: sequenceWaterRange(sequence),
      seederReference:
        !!seederReference && /maize/i.test(sequence) && /wheat/i.test(sequence),
    };
  });
}

const candidates = buildCandidates();
const marketCommodityPreferences = (
  ["Paddy", "Wheat", "Maize"] as const
).filter((commodity) =>
  candidates.some((candidate) =>
    candidateHasCommodity(candidate.sequence, commodity),
  ),
);
const hasObservedMarketCandidates = candidates.some(
  (candidate) => candidate.marketObservations > 0,
);

export function RotationExplorer() {
  const [priority, setPriority] = useState<Priority>("water");
  const [waterAvailability, setWaterAvailability] = useState("unknown");
  const [waterSource, setWaterSource] = useState("unknown");
  const [marketAccess, setMarketAccess] = useState("unknown");
  const [marketPreference, setMarketPreference] = useState("any");
  const [seederAvailable, setSeederAvailable] = useState(false);
  const effectivePriority =
    waterAvailability === "limited" || waterAvailability === "intermittent"
      ? "water"
      : priority;
  const priorityLabel =
    effectivePriority === "water"
      ? "lower published crop ET ranges first"
      : effectivePriority === "soil"
        ? "named legume rotations first"
        : "more matching APMC price observations first";
  const waterAvailabilityLabel =
    waterAvailability === "unknown" ? "not entered" : waterAvailability;
  const waterSourceLabel =
    waterSource === "unknown" ? "not entered" : waterSource;
  const marketAccessLabel =
    marketAccess === "unknown" ? "not entered" : marketAccess;

  const orderedCandidates = useMemo(() => {
    const filtered = candidates.filter(
      (candidate) =>
        marketPreference === "any" ||
        (marketPreference === "observed"
          ? candidate.marketObservations > 0
          : candidateHasCommodity(candidate.sequence, marketPreference)),
    );

    return [...filtered].sort((left, right) => {
      if (seederAvailable && left.seederReference !== right.seederReference) {
        return left.seederReference ? -1 : 1;
      }

      if (effectivePriority === "soil" && left.legume !== right.legume) {
        return left.legume ? -1 : 1;
      }
      if (
        effectivePriority === "market" &&
        left.marketObservations !== right.marketObservations
      ) {
        return right.marketObservations - left.marketObservations;
      }
      if (effectivePriority === "water") {
        const leftWater = left.waterRange?.maximum ?? Number.POSITIVE_INFINITY;
        const rightWater =
          right.waterRange?.maximum ?? Number.POSITIVE_INFINITY;
        if (leftWater !== rightWater) return leftWater - rightWater;
      }

      return left.sequence.localeCompare(right.sequence);
    });
  }, [effectivePriority, marketPreference, seederAvailable]);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.65rem] border border-[#D5BC7B]/20 bg-[#1D2922]/90 p-4 text-[#F6F1E5] shadow-[0_12px_34px_rgba(10,18,13,0.24)] backdrop-blur-xl">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#D5BC7B]">
            Your constraints and priorities
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#F6F1E5]">
            Shape the comparison
          </h2>
          <p className="mt-1 text-sm text-[#E8E3D7]/75">
            These choices reorder published Punjab rotation references; they do
            not create a crop-specific yield or success prediction.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-[#E8E3D7]/85">
            Water availability
            <select
              value={waterAvailability}
              onChange={(event) => {
                const next = event.target.value;
                setWaterAvailability(next);
                if (next === "limited") setPriority("water");
              }}
              className="mt-1.5 w-full rounded-xl border border-[#D5BC7B]/20 bg-[#111B16] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
            >
              <option value="unknown">Not entered</option>
              <option value="limited">Limited</option>
              <option value="intermittent">Intermittent</option>
              <option value="reliable">Reliable</option>
            </select>
          </label>

          <label className="text-sm text-[#E8E3D7]/85">
            Main water source
            <select
              value={waterSource}
              onChange={(event) => setWaterSource(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D5BC7B]/20 bg-[#111B16] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
            >
              <option value="unknown">Not entered / unknown</option>
              <option value="canal">Canal</option>
              <option value="borewell">Borewell</option>
              <option value="both">Canal and borewell</option>
              <option value="rainfed">Rainfed / other</option>
            </select>
          </label>

          <label className="text-sm text-[#E8E3D7]/85">
            Buyer / mandi access
            <select
              value={marketAccess}
              onChange={(event) => setMarketAccess(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D5BC7B]/20 bg-[#111B16] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
            >
              <option value="unknown">Not entered / unknown</option>
              <option value="local-apmc">Local APMC is reachable</option>
              <option value="alternate-buyer">I use another buyer</option>
              <option value="limited">Access is limited</option>
            </select>
          </label>

          <label className="text-sm text-[#E8E3D7]/85">
            Main priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              className="mt-1.5 w-full rounded-xl border border-[#D5BC7B]/20 bg-[#111B16] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
            >
              <option value="water">Conserving water</option>
              <option value="soil">Supporting soil health</option>
              <option value="market">Supplemental income / market</option>
            </select>
          </label>

          <label className="text-sm text-[#E8E3D7]/85">
            Market crop preference
            <select
              value={marketPreference}
              onChange={(event) => setMarketPreference(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#D5BC7B]/20 bg-[#111B16] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
            >
              <option value="any">No preference</option>
              {hasObservedMarketCandidates && (
                <option value="observed">Prefer crops with APMC records</option>
              )}
              {marketCommodityPreferences.map((commodity) => (
                <option key={commodity} value={commodity}>
                  {commodity === "Paddy" ? "Paddy / rice" : commodity}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 self-end rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/70 p-3 text-sm text-[#E8E3D7]/85">
            <input
              type="checkbox"
              checked={seederAvailable}
              onChange={(event) => setSeederAvailable(event.target.checked)}
              className="h-4 w-4 accent-[#D5BC7B]"
            />
            Low-tillage / residue seeder available
          </label>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#E8E3D7]/65">
          Current ordering: {priorityLabel}. Reported water availability is{" "}
          {waterAvailabilityLabel} ({waterSourceLabel}); buyer/mandi access is{" "}
          {marketAccessLabel}. These are farmer inputs, not verified values.
          Choosing “prefer crops with APMC records” filters sequences with
          observations, but a recorded market is not proof of accessibility.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {orderedCandidates.map((candidate, index) => (
          <article
            key={candidate.id}
            className="group rounded-[1.45rem] border border-[#D5BC7B]/15 bg-[#1D2922]/85 p-4 text-[#F6F1E5] shadow-[0_10px_28px_rgba(10,18,13,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D5BC7B]/35"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#D5BC7B]">
                  Published sequence · comparison order {index + 1}
                </p>
                <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  {candidate.legume ? (
                    <Leaf
                      aria-hidden="true"
                      className="h-4 w-4 text-[#D5BC7B]"
                    />
                  ) : (
                    <Wheat
                      aria-hidden="true"
                      className="h-4 w-4 text-[#A3B5A0]"
                    />
                  )}
                  {candidate.sequence}
                </h3>
              </div>
              <span className="rounded-full border border-[#D5BC7B]/20 bg-[#D5BC7B]/[0.06] px-2.5 py-1 text-xs text-[#E8E3D7]/85">
                {candidate.legume ? "Includes a legume" : "No named legume"}
              </span>
            </div>

            {(candidate.waterRange ||
              candidate.localCrops.length > 0 ||
              candidate.marketObservations > 0) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {candidate.waterRange && (
                  <div className="rounded-xl border border-[#D5BC7B]/10 bg-[#111B16]/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-[#D8C68F]">
                      Crop water reference
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#F6F1E5]">
                      <Sprout
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-[#D5BC7B]"
                      />
                      {candidate.waterRange.minimum}–
                      {candidate.waterRange.maximum} mm per crop growing period
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#E8E3D7]/70">
                      Sum of FAO crop ET reference ranges for the sequence. It
                      is not field irrigation demand or a water-saving estimate.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#E8E3D7]/60">
                      {candidate.waterRange.caveat}{" "}
                      <a
                        href={candidate.waterRange.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D5BC7B] underline underline-offset-2"
                      >
                        FAO reference
                      </a>
                    </p>
                  </div>
                )}
                {(candidate.localCrops.length > 0 ||
                  candidate.marketObservations > 0) && (
                  <div className="rounded-xl border border-[#D5BC7B]/10 bg-[#111B16]/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-[#D8C68F]">
                      Local evidence
                    </p>
                    {candidate.localCrops.length > 0 && (
                      <p className="mt-1 text-sm">
                        District crop records: {candidate.localCrops.join(", ")}
                      </p>
                    )}
                    {candidate.marketObservations > 0 && (
                      <p className="mt-1 text-xs text-[#E8E3D7]/70">
                        {candidate.marketObservations} APMC price observations
                        for crops in this sequence.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {candidate.seederReference && (
              <p className="mt-3 rounded-xl border border-[#D5BC7B]/20 bg-[#D5BC7B]/[0.05] p-3 text-xs leading-5 text-[#E8E3D7]/80">
                The supplied PAU practice reference discusses direct sowing
                wheat with a Super Seeder under maize-residue conditions.
                Confirm local residue and machinery fit.
              </p>
            )}

            <div className="mt-3 border-t border-[#D5BC7B]/15 pt-3 text-xs leading-5 text-[#E8E3D7]/65">
              <a
                href={candidate.reference.public_source_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#D5BC7B] underline underline-offset-2"
              >
                {candidate.reference.reference_geography} rotation source
              </a>
              {effectivePriority === "soil" && candidate.legume
                ? " · shown earlier because the sequence names a legume"
                : ""}
              {effectivePriority === "water" && candidate.waterRange
                ? " · ordered by reference ET range, not measured water use"
                : ""}
              {seederAvailable && candidate.seederReference
                ? " · equipment reference matches the selected constraint"
                : ""}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
