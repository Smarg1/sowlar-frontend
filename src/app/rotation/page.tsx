import { BackendAnalysis } from "@component/field/BackendAnalysis";
import {
  EvidenceNote,
  FieldPage,
  Glossary,
  Notice,
  Panel,
} from "@component/field/FieldUi";
import { RotationExplorer } from "@component/field/RotationExplorer";
import {
  fieldEvidence,
  getCropWaterRange,
  getReferencesByCategory,
} from "@lib/data/field-evidence";
import { getAIShowcase, loadBackendResult } from "@lib/services/backend-api";
import { Sprout } from "lucide-react";

const soilPh = fieldEvidence.observations.soilProfile.filter(
  (item) => item.property === "phh2o" && item.value !== null,
);
const rotationSource = getReferencesByCategory("PUBLIC_ROTATION_REFERENCE")[0];
const waterCrops = [
  { crop: "Rice (paddy)", label: "Rice / paddy" },
  { crop: "Wheat", label: "Wheat" },
  { crop: "Maize", label: "Maize" },
  { crop: "Bean (generic pulse proxy)", label: "Generic bean / pulse proxy" },
  { crop: "Sorghum/Millet", label: "Sorghum / millet" },
];
const waterCropsWithRange = waterCrops.flatMap(({ crop, label }) => {
  const range = getCropWaterRange(crop);
  return range ? [{ crop, label, range }] : [];
});
const firstWaterCrop = waterCropsWithRange[0];

export default async function CropRotationPage() {
  const backend = await loadBackendResult(getAIShowcase);

  return (
    <FieldPage
      eyebrow="Planning · Crop Rotation"
      icon={Sprout}
      title="Compare rotation options against your priorities"
      description="Published Punjab rotation sequences are shown alongside district crop history, public crop-water references, and the farmer constraints you enter. The ordering is a comparison aid, not a validated crop-yield prediction."
    >
      <BackendAnalysis
        kind="rotation"
        result={backend.data?.rotation ?? null}
        error={backend.error}
      />
      <BackendAnalysis
        kind="practices"
        result={backend.data?.practices ?? null}
        error={backend.error}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Notice title="Sample coordinate · not a field boundary">
          {fieldEvidence.location.latitude.toFixed(5)}° N,{" "}
          {fieldEvidence.location.longitude.toFixed(5)}° E ·{" "}
          {fieldEvidence.location.district}, {fieldEvidence.location.state}.
          This is the supplied extraction point; the{" "}
          {fieldEvidence.location.sampleBufferRadiusM} m buffer is not farm
          acreage or surveyed parcel geometry.
        </Notice>

        <Notice title="Local judgement is essential" tone="warning">
          The files do not include this farm&apos;s crop history, sowing dates,
          field soil test, canal/borewell reliability, machinery inventory, or
          buyer access. Confirm those details with the farmer and local
          agriculture/extension staff before acting on a sequence.
        </Notice>
      </div>

      <RotationExplorer />

      {(soilPh.length > 0 || waterCropsWithRange.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-12">
          {soilPh.length > 0 && (
            <Panel
              className="xl:col-span-5"
              title="Soil profile · modelled estimate"
              eyebrow="ISRIC SoilGrids"
              description="pH values are 250 m SoilGrids estimates by depth, not a laboratory measurement from this field."
            >
              <div className="overflow-x-auto rounded-xl border border-[#D5BC7B]/15">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#D5BC7B]/[0.07] text-xs uppercase text-[#D8C68F]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Depth</th>
                      <th className="px-3 py-2 font-medium">Modelled pH</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soilPh.map((item) => (
                      <tr
                        key={item.depthBand}
                        className="border-t border-[#D5BC7B]/10"
                      >
                        <td className="px-3 py-2">
                          {item.depthBand.replace("phh2o_", "")}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {item.value.toLocaleString("en-IN", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </td>
                        <td className="px-3 py-2 text-xs text-[#E7E8DF]/60">
                          Modelled 250 m estimate
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <EvidenceNote source={fieldEvidence.sources.soilgrids}>
                Use a current field soil test for decisions about lime,
                fertilizer, salinity, or nutrient rates.
              </EvidenceNote>
            </Panel>
          )}

          {waterCropsWithRange.length > 0 && (
            <Panel
              className="xl:col-span-7"
              title="Seasonal crop evapotranspiration references"
              eyebrow="Food and Agriculture Organization (FAO) crop-water guidance"
              description="Seasonal ET is the water evaporated from soil/canopy plus plant transpiration over a crop growing period. These are generic reference ranges, not this field&apos;s irrigation requirement."
            >
              <div className="space-y-2">
                {waterCropsWithRange.map(({ crop, label, range }) => (
                  <div
                    key={crop}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/65 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm tabular-nums text-[#D5BC7B]">
                      {range.minimum}–{range.maximum} mm / growing period
                    </span>
                    <p className="w-full text-xs leading-5 text-[#E8E3D7]/60">
                      {range.status} · {range.sourceYear} · {range.scope}.{" "}
                      {range.caveat}
                    </p>
                  </div>
                ))}
              </div>
              {firstWaterCrop && (
                <EvidenceNote
                  source={{
                    dataset: "FAO crop-water reference values",
                    coverage: "Reference ranges",
                    resolution: "Crop-level guidance, not field observations",
                    url: firstWaterCrop.range.sourceUrl,
                  }}
                >
                  Generic pulses use a bean proxy. Rotation totals do not
                  account for effective rainfall, soil storage, crop duration
                  overlap, irrigation efficiency, or local cultivar.
                </EvidenceNote>
              )}
            </Panel>
          )}
        </div>
      )}

      <Panel
        title="Why include a nitrogen-fixing crop?"
        eyebrow="Soil health context"
        description="Legumes can host compatible rhizobia in root nodules. These bacteria convert atmospheric nitrogen into forms the plant can use; residues may return some nitrogen and organic matter to the soil when retained and managed well."
        className="xl:max-w-300"
      >
        <Glossary
          terms={[
            {
              term: "Not a guaranteed urea replacement",
              definition:
                "Nitrogen fixation varies with crop, inoculation, soil, water, and management. The biological nitrogen references in the supplied file are broad published values, not measured savings for this farm.",
            },
            {
              term: "Human checks",
              definition:
                "Confirm legume seed and inoculant availability, planting window, residue handling, pest risk, equipment fit, and local buyer access before changing a rotation.",
            },
          ]}
        />
        {rotationSource && (
          <EvidenceNote
            source={{
              dataset: "Punjab Agricultural University rotation references",
              coverage:
                rotationSource.source_year || "Published recommendations",
              resolution: rotationSource.reference_geography,
              url: rotationSource.public_source_url,
            }}
          >
            Crop sequences are extension references, not field-specific
            recommendations.
          </EvidenceNote>
        )}
      </Panel>
    </FieldPage>
  );
}
