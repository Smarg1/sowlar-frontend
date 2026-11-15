import { BackendAnalysis } from "@component/field/BackendAnalysis";
import {
  EvidenceNote,
  FieldPage,
  formatDate,
  formatNumber,
  Glossary,
  MetricCard,
  Panel,
} from "@component/field/FieldUi";
import { TrendChart } from "@component/field/TrendChart";
import { fieldEvidence } from "@lib/data/field-evidence";
import {
  dailyMeans,
  hasSeriesValues,
  latestNumber,
} from "@lib/data/field-metrics";
import { getAIShowcase, loadBackendResult } from "@lib/services/backend-api";
import {
  Droplets,
  FlaskConical,
  Mountain,
  ScanLine,
  ShieldAlert,
  Sprout,
  ThermometerSun,
  Waves,
} from "lucide-react";

const latestMoisture = latestNumber(
  fieldEvidence.observations.smap,
  (item) => item.date,
  (item) => item.rootZone,
);
const latestTemperature = latestNumber(
  fieldEvidence.observations.landsat,
  (item) => item.date,
  (item) => item.surfaceTempC,
);
const latestNdvi = latestNumber(
  fieldEvidence.observations.modis,
  (item) => item.date,
  (item) => item.ndvi,
);
const phTopsoil = fieldEvidence.observations.soilProfile.find(
  (item) => item.property === "phh2o" && item.depthBand === "phh2o_0-5cm_mean",
);
const latestStorage = latestNumber(
  fieldEvidence.observations.gracefo,
  (item) => item.date,
  (item) => item.anomalyCm,
);
const latestBsi = latestNumber(
  fieldEvidence.observations.sentinel2,
  (item) => item.date,
  (item) => item.bsi,
);
const moistureData = dailyMeans(fieldEvidence.observations.smap, [
  {
    key: "rootZone",
    value: (item) => (item.rootZone === null ? null : item.rootZone * 100),
  },
]);
const temperatureData = fieldEvidence.observations.landsat.map((item) => ({
  date: item.date,
  surfaceTemp: item.surfaceTempC,
}));
const vegetationData = fieldEvidence.observations.modis.map((item) => ({
  date: item.date,
  ndvi: item.ndvi,
}));
const storageData = fieldEvidence.observations.gracefo.map((item) => ({
  date: item.date,
  anomaly: item.anomalyCm,
}));
const hasMoistureData = hasSeriesValues(moistureData, ["rootZone"]);
const hasTemperatureData = hasSeriesValues(temperatureData, ["surfaceTemp"]);
const hasVegetationData = hasSeriesValues(vegetationData, ["ndvi"]);
const hasStorageData = hasSeriesValues(storageData, ["anomaly"]);
const hasMetricCards =
  latestMoisture !== undefined ||
  latestTemperature !== undefined ||
  latestNdvi !== undefined ||
  (phTopsoil?.value !== null && phTopsoil !== undefined) ||
  fieldEvidence.observations.terrain.slopeDegrees !== null ||
  latestBsi !== undefined ||
  latestStorage !== undefined;

export default async function FailureRiskPage() {
  const backend = await loadBackendResult(getAIShowcase);

  return (
    <FieldPage
      eyebrow="Decision support · Failure Risk"
      icon={ShieldAlert}
      title="Crop stress evidence and local review"
      description="Compare observed moisture, temperature, vegetation, and regional water-storage signals alongside local field observations when assessing crop stress."
    >
      <BackendAnalysis
        kind="failure"
        result={backend.data?.failure ?? null}
        error={backend.error}
      />

      {hasMetricCards && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
          <MetricCard
            label="Root-zone moisture"
            icon={Droplets}
            value={
              latestMoisture?.rootZone === null || latestMoisture === undefined
                ? null
                : formatNumber(latestMoisture.rootZone * 100)
            }
            unit="% by volume"
            detail={
              latestMoisture
                ? `NASA SMAP L4 gridded estimate · latest: ${formatDate(latestMoisture.date)}`
                : undefined
            }
          />
          <MetricCard
            label="Surface temperature"
            icon={ThermometerSun}
            value={
              latestTemperature?.surfaceTempC === null ||
              latestTemperature === undefined
                ? null
                : formatNumber(latestTemperature.surfaceTempC)
            }
            unit="°C"
            detail={
              latestTemperature
                ? `USGS Landsat 8/9 satellite scene · latest: ${formatDate(latestTemperature.date)}`
                : undefined
            }
          />
          <MetricCard
            label="Vegetation signal"
            icon={Sprout}
            value={
              latestNdvi?.ndvi === null || latestNdvi === undefined
                ? null
                : formatNumber(latestNdvi.ndvi, 3)
            }
            unit="NDVI"
            detail="NASA MODIS 16-day satellite composites · three observations, not crop outcome labels."
          />
          <MetricCard
            label="SoilGrids topsoil pH"
            icon={FlaskConical}
            value={
              phTopsoil?.value === null || phTopsoil === undefined
                ? null
                : formatNumber(phTopsoil.value, 1)
            }
            unit="modelled pH"
            detail="ISRIC SoilGrids 250 m model estimate · 0–5 cm; use a field test for management."
          />
          <MetricCard
            label="SRTM mean slope"
            icon={Mountain}
            value={
              fieldEvidence.observations.terrain.slopeDegrees === null
                ? null
                : formatNumber(
                    fieldEvidence.observations.terrain.slopeDegrees,
                    2,
                  )
            }
            unit="degrees"
            detail="USGS SRTM 30 m terrain model · buffer summary, not a parcel survey."
          />
          <MetricCard
            label="Sentinel-2 bare-soil index"
            icon={ScanLine}
            value={
              latestBsi?.bsi === null || latestBsi === undefined
                ? null
                : formatNumber(latestBsi.bsi, 3)
            }
            unit="index"
            detail="Copernicus Sentinel-2 surface-reflectance scenes · derived index, not bare-soil percentage."
          />
          <MetricCard
            label="GRACE-FO regional water storage"
            icon={Waves}
            value={
              latestStorage?.anomalyCm === null || latestStorage === undefined
                ? null
                : formatNumber(latestStorage.anomalyCm)
            }
            unit="cm equivalent water"
            detail={
              latestStorage
                ? `JPL GRACE-FO regional mascon estimate · ${formatDate(latestStorage.date)}`
                : undefined
            }
          />
        </div>
      )}

      {(hasMoistureData ||
        hasTemperatureData ||
        hasVegetationData ||
        hasStorageData) && (
        <div className="grid gap-4 xl:grid-cols-12">
          {hasMoistureData && (
            <Panel
              className="xl:col-span-7"
              title="Root-zone moisture history"
              eyebrow="NASA SMAP L4"
              description="Daily means derived from 3-hourly model-assimilated surface and root-zone moisture values."
            >
              <TrendChart
                data={moistureData}
                series={[
                  { key: "rootZone", label: "Root zone", color: "#D5BC7B" },
                ]}
                unit="% volumetric"
                precision={1}
              />
              <EvidenceNote source={fieldEvidence.sources.smap}>
                Supplied coverage is Sep–Nov 2026 only. Do not treat it as a
                long-term anomaly or a field-sensor reading.
              </EvidenceNote>
            </Panel>
          )}

          {hasTemperatureData && (
            <Panel
              className="xl:col-span-5"
              title="Surface-temperature observations"
              eyebrow="USGS Landsat 8/9"
              description="Clear-scene land-surface temperature snapshots. These are not daily near-surface air temperatures."
            >
              <TrendChart
                data={temperatureData}
                series={[
                  {
                    key: "surfaceTemp",
                    label: "Surface temperature",
                    color: "#D5BC7B",
                  },
                ]}
                unit="°C"
                allowRange={false}
                precision={1}
              />
              <EvidenceNote source={fieldEvidence.sources.landsat}>
                Sensor support is coarser than the 30 m output grid and there
                are only eight scene records, six with valid temperature.
              </EvidenceNote>
            </Panel>
          )}

          {hasVegetationData && (
            <Panel
              className="xl:col-span-5"
              title="Vegetation index observations"
              eyebrow="NASA MODIS"
              description="NDVI can show relative green vegetation signal, but does not diagnose yield loss, pests, or crop failure by itself."
            >
              <TrendChart
                data={vegetationData}
                series={[{ key: "ndvi", label: "NDVI", color: "#A3B5A0" }]}
                unit="unitless index"
                allowRange={false}
                precision={3}
              />
              <EvidenceNote source={fieldEvidence.sources.modis}>
                Three observations only; do not extend the series to unobserved
                months.
              </EvidenceNote>
            </Panel>
          )}

          {hasStorageData && (
            <Panel
              className="xl:col-span-7"
              title="Regional groundwater storage context"
              eyebrow="JPL GRACE-FO"
              description="Long-term regional total-water-storage anomaly. Its coarse independent support is not a farm aquifer or borewell measurement."
            >
              <TrendChart
                data={storageData}
                series={[
                  {
                    key: "anomaly",
                    label: "Regional storage anomaly",
                    color: "#D5BC7B",
                  },
                ]}
                unit="cm equivalent water"
                precision={1}
              />
              <EvidenceNote source={fieldEvidence.sources.gracefo}>
                For local irrigation reliability, use farmer-reported supply and
                nearby well/canal observations. A regional storage anomaly
                cannot establish access or water budget.
              </EvidenceNote>
            </Panel>
          )}
        </div>
      )}

      <div className="grid gap-4">
        <Panel
          title="When human judgement matters most"
          eyebrow="Support, not replacement"
          className="xl:max-w-300"
        >
          <Glossary
            terms={[
              {
                term: "Before planting",
                definition:
                  "Check seed availability, sowing windows, soil test results, local weather advisories, and expected irrigation supply.",
              },
              {
                term: "During crop growth",
                definition:
                  "Confirm sensor signals in the field and assess crop stage, actual soil moisture, pests, disease, drainage, and water access.",
              },
              {
                term: "Frost decisions",
                definition:
                  "Use local cold-season forecasts and crop-stage thresholds when assessing frost exposure.",
              },
              {
                term: "Local expertise",
                definition:
                  "Use a local agronomist or extension professional for field inspection and treatment decisions; regional satellite indicators are contextual evidence.",
              },
            ]}
          />
        </Panel>
      </div>
    </FieldPage>
  );
}
