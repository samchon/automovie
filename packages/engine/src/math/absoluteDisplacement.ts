/**
 * Area-weighted absolute travel under shared affine interval constraints.
 * Oral enclosure fitting needs signed depth changes with exact fixed seams;
 * boundedDisplacement instead owns positive squared outward contact travel.
 * This owner reduces fixed zero coordinates and identical affine left sides,
 * constructs the standard L1 epigraph, then checks the complete original rows.
 * Coordinates, area weights and numerical tolerances belong to the caller.
 * The objective selects geometric travel, not a tissue constitutive law.
 */
import {
  type IAutoMovieQuadraticRow,
  assembleAutoMovieQuadraticProgram,
  solveAutoMovieQuadraticProgram,
} from "./quadraticProgram";

/**
 * Minimize sum(weight[i] * abs(travel[i])) with the supplied affine intervals.
 * Weights are strictly positive; fixed coordinates have exact zero travel.
 * No coordinate bound is implicit: callers include their physical caps as rows.
 * Identical left sides share the strongest endpoints without coefficient
 * rounding. Every nonzero coefficient remains, and every original row is
 * rechecked after restoring fixed coordinates. Caller arrays remain unchanged.
 *
 * A constant contradiction or native non-Solved result refuses. Successful
 * native output must also satisfy the caller's absolute row tolerance and
 * relative objective-gap tolerance, scaled by max(1, abs(objective)). The dual
 * objective is numerical, not an exact-arithmetic optimality certificate.
 * L1 can have multiple minimizers; equal cost does not imply equal geometry.
 * An all-fixed feasible system returns exact zeros without invoking the kernel.
 *
 * @publicUnconsumed packages/human/src/components/oralVault.ts: The accepted joint oral L1 experiment must first replay through the shared numerical owner before its anatomical construction and identity/performance separation are integrated.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Minimizes signed geometric travel while preserving exact fixed attachments and every affine interval.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses an equivalent sparse epigraph and independently checks restored original-coordinate feasibility and numerical objective gap.
 */
export function solveAutoMovieAbsoluteDisplacement(input: {
  weights: readonly number[];
  fixed: readonly boolean[];
  rows: readonly IAutoMovieQuadraticRow[];
  tolerance: number;
  relativeGap: number;
}): {
  travel: number[];
  objective: number;
  dualObjective: number;
  maximumViolation: number;
  status: number | null;
} {
  if (
    ![input.tolerance, input.relativeGap].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error("Absolute displacement needs positive finite tolerances.");
  if (
    input.weights.some((value) => value <= 0) ||
    input.fixed.length !== input.weights.length ||
    Array.from(input.fixed).some((value) => typeof value !== "boolean")
  )
    throw new Error(
      "Absolute displacement needs positive weights and fixed flags.",
    );
  // Admit the original domain before eliminating any coordinate or constant.
  // The diagonal here only validates weights; the actual L1 Hessian is zero.
  assembleAutoMovieQuadraticProgram({
    diagonal: input.weights,
    linear: input.weights.map(() => 0),
    rows: input.rows,
  });
  const free = input.fixed.flatMap((fixed, id) => (fixed ? [] : [id]));
  const lookup = new Map(free.map((id, i) => [id, i]));
  const unique = new Map<string, IAutoMovieQuadraticRow>();
  for (const row of input.rows) {
    const terms = row.indices
      .flatMap((id, j) =>
        input.fixed[id] || row.weights[j] === 0
          ? []
          : [[lookup.get(id)!, row.weights[j]]],
      )
      .sort((a, b) => a[0] - b[0]);
    if (terms.length === 0) {
      if (
        (row.lower !== null && row.lower > 0) ||
        (row.upper !== null && row.upper < 0)
      )
        throw new Error(
          "Absolute displacement has inconsistent constant rows.",
        );
      continue;
    }
    const key = JSON.stringify(terms);
    let target = unique.get(key);
    if (target === undefined) {
      target = {
        indices: terms.map(([id]) => id),
        weights: terms.map(([, weight]) => weight),
        lower: null,
        upper: null,
      };
      unique.set(key, target);
    }
    if (row.lower !== null)
      target.lower =
        target.lower === null ? row.lower : Math.max(target.lower, row.lower);
    if (row.upper !== null)
      target.upper =
        target.upper === null ? row.upper : Math.min(target.upper, row.upper);
  }
  const travel = input.weights.map(() => 0);
  if (free.length === 0)
    return {
      travel,
      objective: 0,
      dualObjective: 0,
      maximumViolation: 0,
      status: null,
    };
  const n = free.length;
  const rows = [...unique.values()];
  for (let i = 0; i < n; i++) {
    // t >= x and t >= -x implement |x| without adding a quadratic penalty.
    rows.push({ indices: [i, n + i], weights: [1, -1], lower: null, upper: 0 });
    rows.push({
      indices: [i, n + i],
      weights: [-1, -1],
      lower: null,
      upper: 0,
    });
    rows.push({ indices: [n + i], weights: [1], lower: 0, upper: null });
  }
  const solved = solveAutoMovieQuadraticProgram({
    diagonal: new Array<number>(2 * n).fill(0),
    linear: [...free.map(() => 0), ...free.map((id) => input.weights[id])],
    rows,
  });
  if (solved.status !== 1)
    throw new Error(
      `Absolute displacement solve failed: status ${solved.status}.`,
    );
  for (let i = 0; i < n; i++) travel[free[i]] = solved.primal[i];
  let maximumViolation = 0;
  for (const row of input.rows) {
    const value = row.indices.reduce(
      (sum, id, j) => sum + row.weights[j] * travel[id],
      0,
    );
    maximumViolation = Math.max(
      maximumViolation,
      row.lower === null ? 0 : row.lower - value,
      row.upper === null ? 0 : value - row.upper,
    );
  }
  const objective = travel.reduce(
    (sum, value, i) => sum + input.weights[i] * Math.abs(value),
    0,
  );
  if (maximumViolation > input.tolerance)
    throw new Error(
      `Absolute displacement exceeds original-row tolerance: ${maximumViolation}.`,
    );
  if (
    Math.abs(objective - solved.dualObjective) >
    input.relativeGap * Math.max(1, Math.abs(objective))
  )
    throw new Error(
      "Absolute displacement exceeds the numerical objective-gap tolerance.",
    );
  return {
    travel,
    objective,
    dualObjective: solved.dualObjective,
    maximumViolation,
    status: solved.status,
  };
}
