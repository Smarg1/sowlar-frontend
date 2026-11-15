export type RiskLevel = "low" | "moderate" | "high" | "very_high";
export type PracticeCost = "low" | "medium" | "high";
export type ClimatePattern = "stable" | "variable" | "highly_variable";
export type ClimateDirection = "increasing" | "decreasing" | "stable";
export type MarketPosition = "profitable" | "loss_making";

export interface RotationComponents {
  soil_suitability: number;
  water_suitability: number;
  climate_suitability: number;
  soil_improvement: number;
  diversity: number;
  profitability: number;
}

export interface RotationRecommendation {
  sequence: string[];
  score: number;
  components: RotationComponents;
}

export interface RotationResult {
  recommended_rotation: RotationRecommendation[];
  evaluated_sequences: number;
  method: string;
  limitations: string[];
}

export interface PracticeRecommendation {
  practice: string;
  score: number;
  reason: string;
  benefit: string;
  cost: PracticeCost;
}

export interface PracticeResult {
  crop: string;
  detected_problems: string[];
  recommendations: PracticeRecommendation[];
}

export interface FailureComponents {
  heat: number;
  rainfall_deficit: number;
  soil_moisture: number;
  vegetation: number;
}

export interface FailureResult {
  crop: string;
  stress_score: number;
  risk_level: RiskLevel;
  factors: string[];
  components: FailureComponents;
  prediction_type: string;
  limitations: string[];
}

export interface VulnerabilityComponents {
  exposure: number;
  sensitivity: number;
  adaptive_capacity: number;
}

export interface VulnerabilityResult {
  crop: string;
  vulnerability_score: number;
  level: RiskLevel;
  components: VulnerabilityComponents;
  weaknesses: string[];
}

export interface ClimateSummary {
  average_rainfall: number;
  average_temperature: number;
  average_soil_moisture: number;
  average_ndvi: number;
  rainfall_variability: number;
  rainfall_pattern: ClimatePattern;
}

export interface ClimateChanges {
  rainfall_change: number;
  temperature_change: number;
  rainfall_direction: ClimateDirection;
  temperature_direction: ClimateDirection;
}

export interface ClimateAnomaly {
  date: string | null;
  type: "low_rainfall" | "high_temperature";
  value: number;
}

export interface ClimateResult {
  summary: ClimateSummary;
  changes: ClimateChanges;
  anomalies: ClimateAnomaly[];
  observation_count: number;
  limitations: string[];
}

export interface ProfitabilityResult {
  crop: string;
  area_ha: number;
  expected_yield_t_per_ha: number;
  market_price_per_tonne: number;
  revenue: number;
  total_cost: number;
  estimated_profit: number;
  profit_per_hectare: number;
  yield_adjustment: number;
  market_position: MarketPosition;
  limitations: string[];
}

export interface AIShowcaseResult {
  rotation: RotationResult;
  practices: PracticeResult;
  failure: FailureResult;
  vulnerability: VulnerabilityResult;
  climate: ClimateResult;
  profitability: ProfitabilityResult;
}

export type DatabaseTable =
  | "climate"
  | "crops"
  | "farmer"
  | "fields"
  | "history"
  | "market"
  | "practices";

export interface DatabaseRows<
  Row extends Record<string, unknown> = Record<string, unknown>,
> {
  table: DatabaseTable;
  limit: number;
  offset: number;
  data: Row[];
}

export interface CropNamePathParams {
  crop_name: string;
}

export interface RotationQueryParams {
  sequence_length?: number;
}

export interface DatabasePaginationParams {
  limit?: number;
  offset?: number;
}

export interface DatabaseListQueryParams extends DatabasePaginationParams {
  column?: string;
  row?: string;
}

export interface DatabaseFilterQueryParams extends DatabasePaginationParams {
  row: string;
}
