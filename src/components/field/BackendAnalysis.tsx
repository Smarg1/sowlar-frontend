import type {
  AIShowcaseResult,
  ClimateResult,
  FailureResult,
  PracticeResult,
  ProfitabilityResult,
  RotationResult,
  VulnerabilityResult,
} from "@lib/types";
import type { ReactNode } from "react";
import { Panel } from "./FieldUi";

type BackendAnalysisProps =
  | {
      kind: "rotation";
      result: RotationResult | null;
      error: string | null;
    }
  | {
      kind: "practices";
      result: PracticeResult | null;
      error: string | null;
    }
  | {
      kind: "failure";
      result: FailureResult | null;
      error: string | null;
    }
  | {
      kind: "vulnerability";
      result: VulnerabilityResult | null;
      error: string | null;
    }
  | {
      kind: "climate";
      result: ClimateResult | null;
      error: string | null;
    }
  | {
      kind: "profitability";
      result: ProfitabilityResult | null;
      error: string | null;
    }
  | {
      kind: "showcase";
      result: AIShowcaseResult | null;
      error: string | null;
    };

const titles: Record<BackendAnalysisProps["kind"], string> = {
  rotation: "Backend crop-rotation analysis",
  practices: "Backend crop-practice analysis",
  failure: "Backend crop-stress analysis",
  vulnerability: "Backend vulnerability analysis",
  climate: "Backend climate analysis",
  profitability: "Backend profitability analysis",
  showcase: "Live backend analysis",
};

const retryPaths: Record<BackendAnalysisProps["kind"], string> = {
  rotation: "/rotation",
  practices: "/rotation",
  failure: "/failure",
  vulnerability: "/vulnerability",
  climate: "/vulnerability",
  profitability: "/profitability",
  showcase: "/",
};

function number(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-[#E8E3D7]/70">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/65 p-3">
      <dt className="text-xs capitalize text-[#D8C68F]">{title}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function RotationSummary({ result }: { result: RotationResult }) {
  return (
    <>
      <p className="text-xs text-[#E8E3D7]/65">
        {result.evaluated_sequences.toLocaleString("en-IN")} sequences evaluated
        {" · "}
        {result.method}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {result.recommended_rotation.map((item) => (
          <article
            key={`${item.sequence.join("-")}-${item.score}`}
            className="rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/65 p-3"
          >
            <h3 className="font-medium">{item.sequence.join(" → ")}</h3>
            <p className="mt-1 text-xs text-[#D8C68F]">
              Score: {number(item.score)}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(item.components).map(([name, value]) => (
                <Metric key={name} title={label(name)} value={number(value)} />
              ))}
            </dl>
          </article>
        ))}
      </div>
      {result.recommended_rotation.length === 0 && (
        <p className="mt-3 text-sm text-[#E8E3D7]/70">
          The backend returned no rotation recommendations.
        </p>
      )}
      <BulletList items={result.limitations} />
    </>
  );
}

function PracticeSummary({ result }: { result: PracticeResult }) {
  return (
    <>
      <p className="text-sm text-[#E8E3D7]/75">
        Recommendations for {result.crop}
      </p>
      <BulletList items={result.detected_problems} />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {result.recommendations.map((item) => (
          <article
            key={item.practice}
            className="rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/65 p-3"
          >
            <h3 className="font-medium">{item.practice}</h3>
            <p className="mt-1 text-xs text-[#D8C68F]">
              Score {number(item.score)} · {item.cost} cost
            </p>
            <p className="mt-2 text-sm text-[#E8E3D7]/75">{item.reason}</p>
            <p className="mt-1 text-xs text-[#E8E3D7]/65">{item.benefit}</p>
          </article>
        ))}
      </div>
      {result.recommendations.length === 0 && (
        <p className="mt-3 text-sm text-[#E8E3D7]/70">
          The backend returned no practice recommendations.
        </p>
      )}
    </>
  );
}

function FailureSummary({ result }: { result: FailureResult }) {
  return (
    <>
      <p className="text-xl font-semibold capitalize">
        {label(result.risk_level)} risk
        <span className="ml-2 text-sm font-normal text-[#D8C68F]">
          · stress score {number(result.stress_score)}
        </span>
      </p>
      <p className="mt-1 text-xs text-[#E8E3D7]/65">
        Sampled crop: {result.crop} · {result.prediction_type}
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(result.components).map(([name, value]) => (
          <Metric key={name} title={label(name)} value={number(value)} />
        ))}
      </dl>
      <BulletList items={result.factors} />
      <BulletList items={result.limitations} />
    </>
  );
}

function VulnerabilitySummary({ result }: { result: VulnerabilityResult }) {
  return (
    <>
      <p className="text-xl font-semibold capitalize">
        {label(result.level)} vulnerability
        <span className="ml-2 text-sm font-normal text-[#D8C68F]">
          · score {number(result.vulnerability_score)}
        </span>
      </p>
      <p className="mt-1 text-xs text-[#E8E3D7]/65">
        Sampled crop: {result.crop}
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        {Object.entries(result.components).map(([name, value]) => (
          <Metric key={name} title={label(name)} value={number(value)} />
        ))}
      </dl>
      <BulletList items={result.weaknesses} />
    </>
  );
}

function ClimateSummary({ result }: { result: ClimateResult }) {
  return (
    <>
      <p className="text-xs text-[#E8E3D7]/65">
        {result.observation_count.toLocaleString("en-IN")} observations
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title="Average rainfall"
          value={number(result.summary.average_rainfall)}
        />
        <Metric
          title="Average temperature"
          value={`${number(result.summary.average_temperature)} °C`}
        />
        <Metric
          title="Average soil moisture"
          value={number(result.summary.average_soil_moisture)}
        />
        <Metric
          title="Average NDVI"
          value={number(result.summary.average_ndvi)}
        />
        <Metric
          title="Rainfall variability"
          value={number(result.summary.rainfall_variability)}
        />
        <Metric
          title="Rainfall pattern"
          value={label(result.summary.rainfall_pattern)}
        />
        <Metric
          title="Rainfall change"
          value={`${number(result.changes.rainfall_change)} · ${label(result.changes.rainfall_direction)}`}
        />
        <Metric
          title="Temperature change"
          value={`${number(result.changes.temperature_change)} °C · ${label(result.changes.temperature_direction)}`}
        />
      </dl>
      {result.anomalies.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-medium">Detected anomalies</h3>
          <ul className="mt-1 space-y-1 text-xs text-[#E8E3D7]/70">
            {result.anomalies.map((anomaly) => (
              <li key={`${anomaly.date}-${anomaly.type}-${anomaly.value}`}>
                {anomaly.date ?? "Date unavailable"} · {label(anomaly.type)} ·{" "}
                {number(anomaly.value)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <BulletList items={result.limitations} />
    </>
  );
}

function ProfitabilitySummary({ result }: { result: ProfitabilityResult }) {
  return (
    <>
      <p className="mb-3 text-xs capitalize text-[#E8E3D7]/65">
        Sampled crop: {result.crop} · {number(result.area_ha)} ha ·{" "}
        {label(result.market_position)}
      </p>
      <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Expected yield"
          value={`${number(result.expected_yield_t_per_ha)} t/ha`}
        />
        <Metric
          title="Market price"
          value={`${currency(result.market_price_per_tonne)} / tonne`}
        />
        <Metric title="Estimated revenue" value={currency(result.revenue)} />
        <Metric title="Estimated costs" value={currency(result.total_cost)} />
        <Metric
          title="Estimated profit"
          value={currency(result.estimated_profit)}
        />
        <Metric
          title="Profit per hectare"
          value={currency(result.profit_per_hectare)}
        />
        <Metric
          title="Yield adjustment"
          value={number(result.yield_adjustment)}
        />
      </dl>
      <BulletList items={result.limitations} />
    </>
  );
}

function ShowcaseSummary({ result }: { result: AIShowcaseResult }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-medium">Crop rotation</h3>
        <div className="mt-2">
          <RotationSummary result={result.rotation} />
        </div>
      </section>
      <section>
        <h3 className="font-medium">
          Crop practices · {result.practices.crop}
        </h3>
        <div className="mt-2">
          <PracticeSummary result={result.practices} />
        </div>
      </section>
      <section>
        <h3 className="font-medium">Failure risk · {result.failure.crop}</h3>
        <div className="mt-2">
          <FailureSummary result={result.failure} />
        </div>
      </section>
      <section>
        <h3 className="font-medium">
          Vulnerability · {result.vulnerability.crop}
        </h3>
        <div className="mt-2">
          <VulnerabilitySummary result={result.vulnerability} />
        </div>
      </section>
      <section>
        <h3 className="font-medium">Climate analysis</h3>
        <div className="mt-2">
          <ClimateSummary result={result.climate} />
        </div>
      </section>
      <section>
        <h3 className="font-medium">
          Profitability · {result.profitability.crop}
        </h3>
        <div className="mt-2">
          <ProfitabilitySummary result={result.profitability} />
        </div>
      </section>
    </div>
  );
}

export function BackendAnalysis(props: BackendAnalysisProps) {
  let content: ReactNode = null;
  if (props.error) {
    content = (
      <div>
        <p role="alert" className="text-sm text-amber-200">
          {props.error}
        </p>
        <a
          href={retryPaths[props.kind]}
          className="mt-3 inline-block rounded-xl border border-[#D5BC7B]/25 px-3 py-2 text-sm text-[#D5BC7B] hover:bg-[#D5BC7B]/10 focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
        >
          Retry backend request
        </a>
      </div>
    );
  } else {
    switch (props.kind) {
      case "rotation":
        content = props.result ? (
          <RotationSummary result={props.result} />
        ) : null;
        break;
      case "practices":
        content = props.result ? (
          <PracticeSummary result={props.result} />
        ) : null;
        break;
      case "failure":
        content = props.result ? (
          <FailureSummary result={props.result} />
        ) : null;
        break;
      case "vulnerability":
        content = props.result ? (
          <VulnerabilitySummary result={props.result} />
        ) : null;
        break;
      case "climate":
        content = props.result ? (
          <ClimateSummary result={props.result} />
        ) : null;
        break;
      case "profitability":
        content = props.result ? (
          <ProfitabilitySummary result={props.result} />
        ) : null;
        break;
      case "showcase":
        content = props.result ? (
          <ShowcaseSummary result={props.result} />
        ) : null;
        break;
    }
  }

  return (
    <Panel
      title={titles[props.kind]}
      eyebrow="Live SOWLAR backend · heuristic analysis"
      description="Server-rendered from a live request to the backend database. These results are heuristics, not predictions from a trained or generative AI model."
    >
      {content}
    </Panel>
  );
}
