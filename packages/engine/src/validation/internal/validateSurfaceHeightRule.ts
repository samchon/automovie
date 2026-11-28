import type {
  IAutoMovieHeightRule,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/*
 * Check the numeric fields consumed by the world and scene height readers.
 */
export function validateSurfaceHeightRule(
  rule: IAutoMovieHeightRule,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (rule.kind === "constant") {
    finite(rule.value, `${path}.value`, collector);
    return;
  }
  if (rule.kind === "plane") {
    finite(rule.originHeight, `${path}.originHeight`, collector);
    finite(rule.slopeX, `${path}.slopeX`, collector);
    finite(rule.slopeZ, `${path}.slopeZ`, collector);
    return;
  }

  const xOrigin: boolean = finite(rule.originX, `${path}.originX`, collector);
  const zOrigin: boolean = finite(rule.originZ, `${path}.originZ`, collector);
  const xSpacing: boolean = positiveSpacing(
    rule.spacingX,
    `${path}.spacingX`,
    collector,
  );
  const zSpacing: boolean = positiveSpacing(
    rule.spacingZ,
    `${path}.spacingZ`,
    collector,
  );
  const columns: boolean = dimension(
    rule.columns,
    `${path}.columns`,
    collector,
  );
  const rows: boolean = dimension(rule.rows, `${path}.rows`, collector);
  if (!columns || !rows) return;

  const count: number = rule.columns * rule.rows;
  if (rule.samples.length !== count) {
    collector.push(
      "range",
      `${path}.samples`,
      `a heightfield of ${rule.columns} by ${rule.rows} needs exactly ${count} row-major samples, but had ${rule.samples.length}`,
      rule.samples.length,
    );
    return;
  }

  if (xOrigin && xSpacing)
    representableAxis(
      rule.originX,
      rule.spacingX,
      rule.columns,
      `${path}.spacingX`,
      collector,
    );
  if (zOrigin && zSpacing)
    representableAxis(
      rule.originZ,
      rule.spacingZ,
      rule.rows,
      `${path}.spacingZ`,
      collector,
    );
  for (let index: number = 0; index < count; ++index) {
    const sample: number | undefined = rule.samples[index];
    if (!Number.isFinite(sample))
      collector.push(
        "range",
        `${path}.samples[${index}]`,
        "a heightfield sample must be finite",
        sample,
      );
  }
}

function finite(
  value: number,
  path: string,
  collector: IAutoMovieViolationCollector,
): boolean {
  if (Number.isFinite(value)) return true;
  collector.push("range", path, "a surface height field must be finite", value);
  return false;
}

function positiveSpacing(
  value: number,
  path: string,
  collector: IAutoMovieViolationCollector,
): boolean {
  if (Number.isFinite(value) && value > 0) return true;
  collector.push(
    "range",
    path,
    "heightfield spacing must be finite and positive",
    value,
  );
  return false;
}

function dimension(
  value: number,
  path: string,
  collector: IAutoMovieViolationCollector,
): boolean {
  if (Number.isSafeInteger(value) && value >= 2) return true;
  collector.push(
    "range",
    path,
    "a heightfield axis needs a safe integer count of at least two",
    value,
  );
  return false;
}

/* The builder and reader locate knots by this same binary64 expression. */
function representableAxis(
  origin: number,
  spacing: number,
  count: number,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  let previous: number = origin;
  for (let index: number = 1; index < count; ++index) {
    const knot: number = origin + index * spacing;
    if (!Number.isFinite(knot) || knot <= previous) {
      collector.push(
        "range",
        path,
        `heightfield spacing must produce distinct finite knots at index ${index}`,
        spacing,
      );
      return;
    }
    previous = knot;
  }
}
