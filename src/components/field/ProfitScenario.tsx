"use client";

import { useState } from "react";

function parseInput(value: string) {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function ProfitScenario() {
  const [area, setArea] = useState("");
  const [yieldPerAcre, setYieldPerAcre] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [inputCostPerAcre, setInputCostPerAcre] = useState("");

  const enteredArea = parseInput(area);
  const enteredYield = parseInput(yieldPerAcre);
  const enteredPrice = parseInput(salePrice);
  const enteredInputCost = parseInput(inputCostPerAcre);
  let grossRevenue: number | null = null;
  let totalInputs: number | null = null;
  let netPerAcre: number | null = null;

  if (
    enteredArea !== null &&
    enteredArea > 0 &&
    enteredYield !== null &&
    enteredPrice !== null &&
    enteredInputCost !== null
  ) {
    grossRevenue = enteredArea * enteredYield * enteredPrice;
    totalInputs = enteredArea * enteredInputCost;
    netPerAcre = enteredYield * enteredPrice - enteredInputCost;
  }

  return (
    <div>
      <p className="text-sm leading-6 text-[#E8E3D7]/80">
        Enter your own assumptions for a simple scenario. Nothing is saved or
        sent. This is arithmetic on your inputs, not a forecast or verified farm
        result.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Cultivated area (acres)",
            value: area,
            setValue: setArea,
            unit: "acres",
            min: 0.01,
          },
          {
            label: "Expected yield per acre",
            value: yieldPerAcre,
            setValue: setYieldPerAcre,
            unit: "quintals",
            min: 0,
          },
          {
            label: "Expected sale price",
            value: salePrice,
            setValue: setSalePrice,
            unit: "INR / quintal",
            min: 0,
          },
          {
            label: "Total input cost per acre",
            value: inputCostPerAcre,
            setValue: setInputCostPerAcre,
            unit: "INR / acre",
            min: 0,
          },
        ].map((field) => (
          <label
            key={field.label}
            className="rounded-xl border border-[#D5BC7B]/10 bg-[#111B16]/55 p-3 text-xs font-medium text-[#E8E3D7]/85"
          >
            {field.label}
            <input
              type="number"
              min={field.min}
              step="any"
              inputMode="decimal"
              value={field.value}
              onChange={(event) => field.setValue(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#D5BC7B]/20 bg-[#0F1913] px-3 py-2 text-sm text-[#F6F1E5] focus-visible:outline-2 focus-visible:outline-[#D5BC7B]"
            />
            <span className="mt-1 block text-[10px] text-[#D8C68F]/80">
              {field.unit}
            </span>
          </label>
        ))}
      </div>

      {grossRevenue !== null && totalInputs !== null && netPerAcre !== null && (
        <div
          aria-live="polite"
          className="mt-4 grid gap-3 rounded-2  xl border border-[#D5BC7B]/20 bg-[#D5BC7B]/[0.04] p-3 sm:grid-cols-3"
        >
          <Result
            label="Gross revenue (scenario)"
            value={grossRevenue}
            unit="INR"
          />
          <Result
            label="Input costs (scenario)"
            value={totalInputs}
            unit="INR"
          />
          <Result
            label="Net return per acre (scenario)"
            value={netPerAcre}
            unit="INR / acre"
          />
        </div>
      )}
      <p className="mt-2 text-xs leading-5 text-[#E8E3D7]/65">
        Calculation: yield × sale price for gross return; subtract user-entered
        input cost for net return. Labour, transport, financing, crop losses,
        and other costs are excluded unless included in your cost input.
      </p>
    </div>
  );
}

function Result({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  const suffix = unit.includes("/ acre")
    ? "/ acre"
    : unit.includes("INR")
      ? ""
      : unit;

  return (
    <div>
      <p className="text-xs text-[#D8C68F]">{label}</p>
      <p className="mt-1 rounded-xl border border-[#D5BC7B]/15 bg-[#111B16]/65 px-3 py-2 text-lg font-semibold tabular-nums text-[#F6F1E5]">
        {unit.includes("INR")
          ? new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            }).format(value)
          : value.toLocaleString("en-IN")}{" "}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-[#E8E3D7]/75">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
