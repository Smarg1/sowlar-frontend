# SOWLAR Frontend

SOWLAR is a responsive agricultural decision-support dashboard built with
Next.js, React, and TypeScript. It brings together a fixed Jalandhar, Punjab
evidence snapshot, interactive tools for comparing that evidence, and
server-rendered heuristic analyses from the hosted SOWLAR API.

The interface is intended to help users review evidence and questions to take
to local agricultural experts. It is not a farm-management system, a
field-boundary map, or a substitute for agronomic advice.

## What the application does

- Summarizes the configured sample location, latest available indicators,
  reported market prices and arrivals, climate observations, and a backend
  analysis showcase on the home dashboard.
- Compares published crop-rotation references against crop-water, district
  history, market-record, and user-entered context on the rotation page.
- Displays backend crop-stress and vulnerability analyses alongside satellite,
  soil-model, weather, and regional water observations.
- Shows backend profitability analysis, district crop statistics, market
  records, and published economic benchmarks. It also provides a local
  calculator for farmer-entered assumptions.
- Links data panels to source, coverage, units, and interpretation notes where
  those details are available in the evidence file.

Backend analysis is heuristic decision support, not a trained or generative AI
prediction. Remote and modelled observations are not measurements from an
individual farm.

## Application pages

| Route              | Purpose                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Dashboard with sample location and clock, field indicators, published rotation examples, market summaries, recent climate observations, crop-stress indicators, and the complete backend showcase. |
| `/rotation`        | Backend rotation and practice results; a local comparison tool for published Punjab rotation references; crop-water ranges; soil profile and nitrogen-fixation context.                            |
| `/failure`         | Backend crop-stress result with local moisture, temperature, vegetation, and regional water-storage evidence and time-series charts.                                                               |
| `/vulnerability`   | Backend vulnerability and climate results with satellite, weather, soil, terrain, and groundwater context.                                                                                         |
| `/profitability`   | Backend profitability result, market prices and arrivals, district crop-production history, public benchmarks, and a local profit-scenario calculator.                                             |
| Any unmatched path | A custom “Coordinates Out of Bounds” 404 page with a link back to the dashboard.                                                                                                                   |

The shared responsive navigation is defined in
[`src/components/navbar/index.tsx`](./src/components/navbar/index.tsx). The
global layout and page metadata are in
[`src/app/layout.tsx`](./src/app/layout.tsx).

## Data sources and interpretation

### Local evidence snapshot

[`src/lib/data/field-evidence.json`](./src/lib/data/field-evidence.json) is a
versioned snapshot used by the dashboard and the evidence pages. It includes
source metadata and public references as well as observations and agricultural
records, including:

- NASA SMAP soil moisture, GPM rainfall, ERA5-Land weather, and NASA POWER
  daily weather.
- Landsat surface temperature, MODIS vegetation indices, and Sentinel-2
  bare-soil index.
- ISRIC SoilGrids soil-property estimates, SRTM terrain summaries, GRACE/GRACE-FO
  regional water-storage anomalies, and nearby CGWB groundwater records.
- AGMARKNET reported wholesale prices and arrivals, district crop
  area/production/yield statistics, and public rotation, crop-water, and
  economic references.

The sample point is in Jalandhar, Punjab (31.22192° N, 75.39125° E). The
configured extraction buffer is 150 m, but the data does not provide a surveyed
field boundary or farm area. Data coverage and resolution vary by source; the
source metadata and panel notes describe those limits.

This file is a supplied snapshot, not a live connection to the listed public
data providers. Changing the backend API does not refresh this local evidence.
Missing measurements are represented as missing values, not zero. Modelled,
gridded, or regional values must not be interpreted as precise farm-level
measurements; market reports are not guaranteed farm-gate offers or proof of
buyer access.

Data helpers in [`src/lib/data/field-evidence.ts`](./src/lib/data/field-evidence.ts)
provide typed access to the snapshot, source references, and crop-water ranges.
[`src/lib/data/field-metrics.ts`](./src/lib/data/field-metrics.ts) contains
helpers for daily means, latest valid readings, and determining whether a chart
has usable values.

### Backend analysis

The pages combine the local evidence snapshot with results from the SOWLAR
FastAPI service. The backend analysis endpoints also use heuristics; the
frontend presents their results and limitations as returned and does not train
or run a machine-learning model.

## Hosted backend integration

The frontend uses this hosted backend API origin for server-side fetching:

```text
https://sowlar-backend.onrender.com
```

Set the following server-only variables in the frontend root `.env.local` file
for local development, or in the hosting provider's environment settings:

```env
API_URL=https://sowlar-backend.onrender.com
API_KEY=<the-backend-api-key>
```

`API_URL` should be the backend origin, without `/api/v1`; the service appends
the versioned API path. `API_KEY` must match the key configured on the backend
(the API requires at least 32 characters). Never prefix it with
`NEXT_PUBLIC_`, put it in browser code, or commit it to source control. The
repository ignores `.env*` files. Restart the development server after
changing environment variables.

### Request flow and caching

1. The dashboard and analysis pages call the server-only service in
   [`src/lib/services/backend-api.ts`](./src/lib/services/backend-api.ts)
   while rendering. They do not call a frontend API proxy route.
2. The current pages request `GET /api/v1/ai/showcase` from the hosted backend
   and select the section each page needs.
3. The frontend sends the API key in the `X-API-Key` request header. The key
   stays on the server and is not included in rendered page data.
4. The response is typed with the interfaces in
   [`src/lib/types.ts`](./src/lib/types.ts) and displayed by
   [`src/components/field/BackendAnalysis.tsx`](./src/components/field/BackendAnalysis.tsx).
5. Backend results use Next.js `"use cache"` with the `minutes` cache profile;
   the server-side cache revalidates after one minute.

The showcase endpoint returns the analysis objects directly, grouped under
`rotation`, `practices`, `failure`, `vulnerability`, `climate`, and
`profitability`. Their TypeScript shapes are defined in
[`src/lib/types.ts`](./src/lib/types.ts):

| Result        | Data included                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rotation      | Recommended crop sequences, an overall score and soil/water/climate/soil-improvement/diversity/profitability components, evaluated sequence count, method, and limitations. |
| Practices     | Crop, detected problems, and recommendations with score, reason, benefit, and cost level.                                                                                   |
| Failure       | Crop, stress score, risk level, contributing factors, heat/rainfall-deficit/soil-moisture/vegetation components, prediction type, and limitations.                          |
| Vulnerability | Crop, vulnerability score and level, exposure/sensitivity/adaptive-capacity components, and weaknesses.                                                                     |
| Climate       | Average rainfall, temperature, soil moisture, and NDVI; rainfall variability and pattern; changes and directions; anomalies, observation count, and limitations.            |
| Profitability | Crop, area, expected yield, market price, revenue, total cost, estimated profit, profit per hectare, yield adjustment, market position, and limitations.                    |

The client also defines typed helpers for these GET endpoints:

| Helper                      | Backend path                                        |
| --------------------------- | --------------------------------------------------- |
| `getAIShowcase`             | `/api/v1/ai/showcase`                               |
| `getCrops`                  | `/api/v1/db/crops?limit=1000`                       |
| `getRotationRecommendation` | `/api/v1/ai/rotation/recommend?sequence_length={n}` |
| `getPracticeAnalysis`       | `/api/v1/ai/practices/{crop_name}`                  |
| `getFailureAnalysis`        | `/api/v1/ai/failure/{crop_name}`                    |
| `getVulnerabilityAnalysis`  | `/api/v1/ai/vulnerability/{crop_name}`              |
| `getClimateAnalysis`        | `/api/v1/ai/climate`                                |
| `getProfitabilityAnalysis`  | `/api/v1/ai/profitability/{crop_name}`              |

The current pages use `getAIShowcase` and select their respective results; the
individual helpers are available for pages that need to request a single
analysis.

`loadBackendResult` converts request failures into an error message for the
backend panel, so the page can continue to show its local evidence. The service
validates the API URL, reports missing configuration, applies a 90-second
request timeout, and surfaces backend HTTP or connection errors. If the hosted
backend or its data source is unavailable, the backend panel may show an error;
local snapshot-based panels remain available.

## Interactive components

- [`TrendChart`](./src/components/field/TrendChart.tsx) renders time series
  with Recharts, optional date-range controls, and a market-series selector
  that can be used with a mouse or keyboard. Missing values remain gaps.
- [`RotationExplorer`](./src/components/field/RotationExplorer.tsx) lets users
  enter water availability, water source, buyer access, comparison priority,
  market preference, and seeder availability. It reorders or filters published
  rotation references using available evidence. It does not produce a
  field-specific yield or success prediction, and selections are not saved.
- [`MarketExplorer`](./src/components/field/MarketExplorer.tsx) filters the
  supplied AGMARKNET snapshot by commodity and compares reported prices and
  arrivals across markets.
- [`ProfitScenario`](./src/components/field/ProfitScenario.tsx) calculates
  gross revenue, entered input costs, and net return per acre from values typed
  by the user. This calculation stays in the browser, is not saved or sent to
  the backend, and excludes costs the user does not include.
- [`Details`](./src/components/Details.tsx) updates the displayed browser
  date/time once per minute.

Reusable evidence panels, metrics, glossary, notices, and number/date
formatting are in
[`src/components/field/FieldUi.tsx`](./src/components/field/FieldUi.tsx).
Tailwind CSS theme variables and the global visual style are in
[`src/app/globals.css`](./src/app/globals.css); the public logo and background
assets are in [`public/`](./public/).

## Project structure

```text
src/
  app/                 App Router layout, global styles, and page routes
  components/
    field/             Evidence panels, charts, and interactive field tools
    navbar/            Shared responsive navigation
    ui/                Reusable UI primitives
  lib/
    data/              Local evidence snapshot and data-processing helpers
    services/          Server-only backend API client
    types.ts           Backend response and query types
public/                Logo and background image
.github/workflows/     Frontend CI and React Doctor workflows
```

The project uses the `@app/*`, `@component/*`, `@lib/*`, and `@utils/*`
TypeScript path aliases configured in [`tsconfig.json`](./tsconfig.json).
`src/lib/utils.ts` exports the class-name utility used by components.

## Development setup

The package declares Node.js `26.x` and pnpm `>=12`; the package manager is
pinned to pnpm `12.18.0`. Install dependencies and configure the backend
environment variables above:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses server
components for page data and client components only where browser interaction
is needed. The hosted backend key must be available to the server process.

## Common commands

| Command                   | What it does                                                              |
| ------------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`                | Starts the Next.js development server.                                    |
| `pnpm build`              | Creates a production build.                                               |
| `pnpm start`              | Serves the production build.                                              |
| `pnpm format`             | Formats files with Biome.                                                 |
| `pnpm exec biome check .` | Runs Biome formatting, lint, and assist checks.                           |
| `pnpm typecheck`          | Generates Next.js route types and runs TypeScript without emitting files. |
| `pnpm lint`               | Formats the project, runs Biome checks, then runs the typecheck script.   |
| `pnpm doctor`             | Runs the React Doctor diagnostic.                                         |

There is no dedicated test command in `package.json` at present. The main CI
workflow runs dependency installation, Biome checks, TypeScript checking, and a
production build on pushes and pull requests targeting `main` or `dev`.
React Doctor runs as a separate advisory workflow on pull requests and pushes
to `main`.

## Framework and styling

The application uses Next.js 16 App Router, React, and strict TypeScript.
[`next.config.ts`](./next.config.ts) enables Cache Components, partial
prefetching, the React Compiler, and the Tailwind Turbopack CSS loader. Styling
uses Tailwind CSS, theme variables, and selected shadcn/Base UI primitives;
Figtree and Noto Sans are configured in the root layout.

The `package.json` engine field declares Node.js 26.x, while the current main
CI workflow configures Node.js 24. Use the declared package requirement for
local development; align the CI version if the supported Node.js version is
changed.
