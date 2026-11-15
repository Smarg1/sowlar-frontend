import rawEvidence from "@lib/data/field-evidence.json";

export interface SourceMetadata {
  dataset: string;
  coverage: string;
  resolution: string;
  cadence: string;
  units: string;
  qualityNote: string;
  url: string;
  documentationUrl?: string;
}

export interface PublicReference {
  category: string;
  metric: string;
  value: string;
  unit: string;
  calculation_or_source_method: string;
  source_file: string;
  date_coverage: string;
  spatial_resolution_or_scope: string;
  status: string;
  interpretation_caveat: string;
  public_source_url: string;
  source_year: string;
  reference_geography: string;
}

export interface FieldEvidence {
  location: {
    latitude: number;
    longitude: number;
    district: string;
    state: string;
    sampleBufferRadiusM: number;
    fieldAreaAcres: number | null;
    fieldBoundaryAvailable: boolean;
  };
  sources: Record<string, SourceMetadata>;
  observations: {
    smap: Array<{
      date: string;
      surface: number | null;
      rootZone: number | null;
    }>;
    rainfall: Array<{ date: string; mm: number | null }>;
    era5: Array<{
      date: string;
      airTempC: number | null;
      dewpointC: number | null;
      relativeHumidityPct: number | null;
      windSpeedMps: number | null;
      solarRadiationMjM2Day: number | null;
    }>;
    nasaPower: Array<{
      date: string;
      minTempC: number | null;
      maxTempC: number | null;
      rainMm: number | null;
      evapotranspirationEnergyFluxMjM2Day: number | null;
    }>;
    landsat: Array<{
      date: string;
      surfaceTempC: number | null;
      uncertaintyK: number | null;
    }>;
    modis: Array<{ date: string; ndvi: number | null; evi: number | null }>;
    sentinel2: Array<{ date: string; bsi: number | null }>;
    soilProfile: Array<{
      property: string;
      depthBand: string;
      depthOrder: number;
      value: number | null;
      unit: string;
      valueNote: string;
    }>;
    terrain: {
      elevationM: number | null;
      slopeDegrees: number | null;
      sourceResolutionM: number | null;
    };
    gracefo: Array<{
      date: string;
      anomalyCm: number | null;
      uncertaintyCm: number | null;
    }>;
    nearbyGroundwaterStation: {
      name: string | null;
      distanceKm: number | null;
      observations: Array<{ date: string; levelM: number | null }>;
    };
  };
  agriculture: {
    cropStatistics: Array<{
      crop: string;
      season: string;
      year: string;
      areaHa: number | null;
      production: number | null;
      productionUnit: string;
      yield: number | null;
      yieldUnit: string;
    }>;
    marketPrices: Array<{
      period: string;
      commodity: string;
      market: string;
      value: number | null;
      unit: string;
    }>;
    marketArrivals: Array<{
      period: string;
      commodity: string;
      market: string;
      value: number | null;
      unit: string;
    }>;
    marketCoverage: Array<{
      commodity: string;
      requestedCalls: number;
      successfulCalls: number;
      noRowsCalls: number;
      priceObservations: number;
      arrivalObservations: number;
      marketsWithRecords: number;
      coverageNote: string;
    }>;
    publicReferences: PublicReference[];
  };
}

export const fieldEvidence = rawEvidence satisfies FieldEvidence;

export function hasNumericValue<T extends { value: number | null }>(
  record: T,
): record is T & { value: number } {
  return record.value !== null && Number.isFinite(record.value);
}

export function getReference(metric: string) {
  return fieldEvidence.agriculture.publicReferences.find(
    (reference) => reference.metric === metric,
  );
}

export function getReferencesByCategory(category: string) {
  return fieldEvidence.agriculture.publicReferences.filter(
    (reference) => reference.category === category,
  );
}

export function getCropWaterRange(cropName: string) {
  const references = fieldEvidence.agriculture.publicReferences;
  const cropPart = cropName.toLowerCase();
  const cropWaterReferences = references.filter(
    (reference) =>
      reference.category === "PUBLIC_CROP_WATER_NEED" &&
      reference.metric
        .toLowerCase()
        .startsWith(`fao.${cropPart}.seasonal_et_need_`),
  );
  const minimum = cropWaterReferences.find((reference) =>
    reference.metric.endsWith("_min"),
  );
  const maximum = cropWaterReferences.find((reference) =>
    reference.metric.endsWith("_max"),
  );

  if (!minimum || !maximum) {
    return null;
  }

  return {
    minimum: Number(minimum.value),
    maximum: Number(maximum.value),
    unit: minimum.unit,
    sourceUrl: minimum.public_source_url,
    status: minimum.status,
    coverage: minimum.date_coverage,
    scope: minimum.spatial_resolution_or_scope,
    sourceYear: minimum.source_year,
    caveat: minimum.interpretation_caveat,
  };
}
