import "server-only";

import type {
  AIShowcaseResult,
  ClimateResult,
  DatabaseRows,
  FailureResult,
  PracticeResult,
  ProfitabilityResult,
  RotationResult,
  VulnerabilityResult,
} from "@lib/types";
import { cacheLife } from "next/cache";

function getApiBaseUrl() {
  const configuredUrl = process.env.API_URL?.trim();
  if (!configuredUrl) {
    throw new Error("Set API_URL to the hosted SOWLAR API origin.");
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("API_URL must be a valid absolute URL.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("API_URL must be an HTTP(S) URL without credentials.");
  }

  url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  return url.toString().replace(/\/+$/, "");
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  "use cache";
  cacheLife("minutes");

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set API_KEY to the key configured on the SOWLAR API.");
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1${endpoint}`, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new Error(
        "The SOWLAR API request timed out. The hosted service may be starting; reload the page shortly.",
      );
    }
    throw new Error(
      "Cannot connect to the SOWLAR API. Check API_URL and confirm the hosted service is online.",
      { cause: error },
    );
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
      ) {
        detail = body.detail;
      }
    } catch {
      // Keep the HTTP status when the backend returns a non-JSON error page.
    }
    throw new Error(`SOWLAR API returned ${response.status}: ${detail}`);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error("SOWLAR API returned an invalid JSON response.", {
      cause: error,
    });
  }
}

export function getCrops() {
  return fetchApi<DatabaseRows<{ crop_name: string }>>("/db/crops?limit=1000");
}

export function getRotationRecommendation(sequenceLength = 3) {
  const query = new URLSearchParams({
    sequence_length: String(sequenceLength),
  });
  return fetchApi<RotationResult>(`/ai/rotation/recommend?${query.toString()}`);
}

export function getPracticeAnalysis(crop: string) {
  return fetchApi<PracticeResult>(`/ai/practices/${encodeURIComponent(crop)}`);
}

export function getFailureAnalysis(crop: string) {
  return fetchApi<FailureResult>(`/ai/failure/${encodeURIComponent(crop)}`);
}

export function getVulnerabilityAnalysis(crop: string) {
  return fetchApi<VulnerabilityResult>(
    `/ai/vulnerability/${encodeURIComponent(crop)}`,
  );
}

export function getClimateAnalysis() {
  return fetchApi<ClimateResult>("/ai/climate");
}

export function getProfitabilityAnalysis(crop: string) {
  return fetchApi<ProfitabilityResult>(
    `/ai/profitability/${encodeURIComponent(crop)}`,
  );
}

export function getAIShowcase() {
  return fetchApi<AIShowcaseResult>("/ai/showcase");
}

export async function loadBackendResult<T>(
  request: () => Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await request(), error: null };
  } catch (cause) {
    return {
      data: null,
      error:
        cause instanceof Error
          ? cause.message
          : "Unable to load SOWLAR analysis.",
    };
  }
}
