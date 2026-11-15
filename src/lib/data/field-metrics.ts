import type { TrendPoint } from "@component/field/TrendChart";

export function dailyMeans<T extends { date: string }>(
  rows: T[],
  fields: Array<{ key: string; value: (row: T) => number | null }>,
): TrendPoint[] {
  const grouped = new Map<
    string,
    Map<string, { total: number; count: number }>
  >();

  for (const row of rows) {
    let values = grouped.get(row.date);
    if (!values) {
      values = new Map();
      grouped.set(row.date, values);
    }

    for (const field of fields) {
      const value = field.value(row);
      if (value === null || !Number.isFinite(value)) continue;
      const current = values.get(field.key) ?? { total: 0, count: 0 };
      values.set(field.key, {
        total: current.total + value,
        count: current.count + 1,
      });
    }
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => {
      const point: TrendPoint = { date };
      for (const field of fields) {
        const aggregate = values.get(field.key);
        point[field.key] = aggregate ? aggregate.total / aggregate.count : null;
      }
      return point;
    });
}

export function hasSeriesValues(data: TrendPoint[], keys: string[]): boolean {
  return data.some((point) =>
    keys.some((key) => {
      const value = point[key];
      return typeof value === "number" && Number.isFinite(value);
    }),
  );
}

export function latestNumber<T>(
  rows: T[],
  getDate: (row: T) => string,
  getValue: (row: T) => number | null,
) {
  return [...rows]
    .sort((left, right) => getDate(right).localeCompare(getDate(left)))
    .find((row) => {
      const value = getValue(row);
      return value !== null && Number.isFinite(value);
    });
}
