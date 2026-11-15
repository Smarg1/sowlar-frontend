# FIELDSHIP — Clean Data Package

Prepared from the uploaded `FIELDSHIP_DATA.zip`. This is a **data-only handoff**: no Python scripts, PowerShell scripts, virtual environments, credential files, or executable code are included.

## Project test location and extraction scope

- Test coordinate: **31.22192 N, 75.39125 E**.
- Field ID: `FIELD_31p22192_75p39125`.
- The Earth Engine extraction used a **150 m circular buffer around the supplied coordinate**, not a surveyed/cadastral field boundary.
- Environmental collection period requested: 2026-09-01 inclusive to 2026-11-14 exclusive. Individual datasets have shorter available ranges as listed below.
- Coarse data retain their native/effective support scale; the buffer does not make 9–11 km pixels into field-resolution observations.

## Folder contents

### `01_ENVIRONMENTAL_DATA`

| File | Records | Coverage | Resolution / cadence | Main caveat |
|---|---:|---|---|---|
| `smap_soil_moisture.csv` | 568 | 2026-09-01 to 2026-11-10 | ~9–11 km; 3-hourly | Regional/model-assimilated moisture; 566 valid values per moisture variable out of 568 rows. |
| `gpm_daily_rainfall.csv` | 74 | 2026-09-01 to 2026-11-13 | ~11.1 km; daily | Estimated daily rainfall in mm/day; coarse support. |
| `era5_land_daily_weather.csv` | 67 | 2026-09-01 to 2026-11-06 | ~11.1 km; daily | Reanalysis; data after Nov 6 not present in this extract. |
| `landsat_surface_temperature.csv` | 8 | 2026-09-04 to 2026-10-30 | 30 m grid; thermal native support ~100 m; scene dates | 8 scene rows; 6 valid LST values. Not daily readings. |
| `modis_ndvi_evi.csv` | 3 | 2026-09-14 to 2026-10-16 | 250 m; 16-day composite | Only 3 observations; insufficient alone for a full seasonal trend. |
| `sentinel2_bare_soil_index.csv` | 19 | 2026-09-03 to 2026-11-07 | 20 m calculation; scene dates | BSI is a derived spectral index, not a direct percentage of bare soil. |

### `02_SOIL_AND_TERRAIN`

- `soilgrids_profile_scaled.csv`: 48 records covering 8 properties (pH, organic carbon, nitrogen, clay, sand, silt, bulk density and cation exchange capacity) across 6 depth intervals. This file retains the original stored value and scale factor alongside the scaled value/unit. These are 250 m modelled estimates, not a laboratory soil test.
- `srtm_elevation_slope.csv`: one buffer summary for elevation and slope from the SRTM 30 m DEM. It is not a cadastral-boundary statistic.

### `03_WATER_RESOURCES`

- `gracefo_regional_water_storage_anomaly.csv`: 261 monthly JPL mascon time records. The output grid is 0.5° but the independent mascon support is approximately 3°; this is a **regional terrestrial water-storage anomaly**, not a farm aquifer/borewell level. The original NetCDF binary was omitted from this text-first handoff; a citation file is included in metadata.
- `cgwb_jalandhar_quarterly_groundwater_observations.csv`: 376 observations from 78 CGWB monitoring stations in Jalandhar district; actual dates in this file run from **2021-01-10 through 2024-01-01** (despite the source filename's 2021–2025 label). Nearest listed station is `Kang Sahib Rai-Pz` at approximately 6.051 km straight-line from the test coordinate. This is district monitoring data, not the farmer's borewell.
- `cgwb_jalandhar_station_catalog.csv`: 78 unique station records with coordinates and approximate distance from the test coordinate.
- `cwc_punjab_canal_network_attributes.csv`: 1151 Punjab canal attribute records from the CWC national layer.
- `cwc_jalandhar_named_canal_attributes.csv`: 2 rows whose canal/project name contains “Jalandhar”. A name match does not establish that a field is connected to or receives water from the canal.
- **CWC geometry caveat:** the input GeoJSON had coordinate values on a projected-looking scale and no declared CRS field. The geometry has therefore been left out of this share package rather than redistributed as map-ready lon/lat. Attribute tables are retained; do not calculate field-to-canal distance from these tables.

### `04_MARKET_DATA`

- `agmarknet_monthly_price_observations.csv`: 126 unique monthly market price observations (INR/quintal).
- `agmarknet_monthly_arrival_observations.csv`: 126 unique monthly market-arrival observations (metric tonnes as identified for the monthly report endpoint).
- `agmarknet_monthly_report_change_indicators.csv`: 92 reported month-on-month/year-on-year change indicators from report rows.
- `agmarknet_monthly_request_log.csv`: 120 monthly report requests.
- `agmarknet_coverage_by_commodity.csv`: per-crop query coverage.

**Market-data warning:** monthly market reports are not daily trade records and not farm-gate prices. They are market-level monthly summaries. Mandi arrivals indicate reported market supply inflow; arrivals are **not consumer demand**. Do not use them as a farmer's realized sale price or as demand without an appropriate separate demand model/source.

Uploaded request log status: **28 OK**, **92 NO_ROWS**, **0 ERROR** out of 120 requests. `NO_ROWS` means no rows were returned for the specified query; it does not prove that no trade occurred. Returned price/arrival observations currently appear for four of the six requested commodities. Coverage by commodity:
- Maize: 48 unique price observations; periods present: 2025-01, 2025-04, 2025-05, 2025-06, 2025-07, 2025-08, 2025-09, 2025-10, 2025-12, 2026-05, 2026-06, 2026-07, 2026-08, 2026-09, 2026-10.
- Paddy (Basmati): 2 unique price observations; periods present: 2025-10.
- Paddy (Common): 29 unique price observations; periods present: 2025-09, 2025-10, 2026-10.
- Wheat: 47 unique price observations; periods present: 2025-04, 2025-05, 2025-06, 2026-04, 2026-05.

### `05_AGRICULTURAL_STATISTICS`

- `des_jalandhar_area_production_yield.csv`: 104 normalized crop-year entries for Jalandhar district, crop years 2015–16 through 2022–23, across 13 crop/crop-group labels. This is district-level reported area, production and yield, not field-level yield. Units are retained from the report; cotton production/yield use bales, while most other crops use tonnes.
- The supplied DES report did **not** contain cost-of-cultivation values. A cost-of-cultivation dataset is not included in this package.
- No GAEZ suitability/potential-yield raster or summary data was included. GAEZ was intentionally excluded from this package.

## Data handling rules

1. Blank cells mean missing/not returned/not valid. They are not zeros.
2. `-9999` placeholders have been converted to blank cells in cleaned measurement CSVs.
3. Source attribution, field ID, native resolution and support metadata are retained where available.
4. Values calculated from source metadata (e.g. station-to-test-coordinate distance) are explicitly labeled as derived.
5. The package does not include crop-failure probabilities, crop-rotation recommendations or profitability predictions. Those require separately designed models, suitable local training/validation data and farmer-specific inputs.

## Data sources

- NASA SMAP L4 V8, GPM IMERG V07, Landsat Collection 2 Level-2, MODIS MOD13Q1.061, Copernicus Sentinel-2 SR Harmonized, ERA5-Land Daily Aggregated, ISRIC SoilGrids and USGS SRTM: source URLs in `00_README_AND_METADATA/source_urls.txt`.
- GRACE-FO source citation: `00_README_AND_METADATA/gracefo_source_citation.txt`.
- CGWB, CWC/NWDP, AGMARKNET and DES portal URLs are included in `source_urls.txt`.

## Contents checklist

- Only data files and data documentation are included (CSV, JSON, Markdown, TXT).
- No scripts, source-code files, virtual environments, authentication keys or `_netrc` files are included.
- The CWC national geometry and GRACE-FO source NetCDF were omitted from this text-oriented package; the selected/reduced tabular outputs and source notes are included instead.
