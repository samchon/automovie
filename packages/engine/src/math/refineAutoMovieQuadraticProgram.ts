import { assembleAutoMovieQuadraticProgram } from "./assembleAutoMovieQuadraticProgram";
import { polishAutoMovieQuadraticProgram } from "./polishAutoMovieQuadraticProgram";
import type { IAutoMovieQuadraticRefinementInterval as Group } from "./IAutoMovieQuadraticRefinementInterval";
import type { IAutoMovieQuadraticRefinementNativeCall } from "./IAutoMovieQuadraticRefinementNativeCall";
import type { IAutoMovieQuadraticRefinementOptions } from "./IAutoMovieQuadraticRefinementOptions";
import type { IAutoMovieQuadraticRefinementResult } from "./IAutoMovieQuadraticRefinementResult";
import type { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

type Problem = Parameters<typeof solveAutoMovieQuadraticProgram>[0];
type Native = ReturnType<typeof solveAutoMovieQuadraticProgram>;

/**
 * Polish a Solved native diagonal convex QP in its original coordinates.
 * Exact coefficient copies retain intersected interval metadata; every original
 * row remains in final feasibility, stationarity and complementarity checks.
 * Independently feasible and complementary native values first retain their
 * primal while signed-dual coordinate corrections seek original stationarity.
 * Otherwise exact interval intersections supply compatible active endpoint equations
 * for corrections near the original native primal and signed dual. Only
 * identical coefficients share an equation; every original row and endpoint
 * remains in independent final admission.
 *
 * Only a finite candidate satisfying every original KKT condition at the
 * caller's unchanged tolerance replaces the preceding native primal and dual.
 * Failed or wrongly selected active sets retain the original candidate, native
 * status and actual polishing diagnostics. An AlmostSolved or infeasible native
 * result is never promoted. No extra native solve, slack expansion, objective
 * amplification or permanent ridge is introduced. One selected path owns the
 * caller's existing correction budget; no failed path adds a second budget.
 *
 * Stellato et al. (2020), section 4, describe active-set polishing and correction
 * against the unregularized KKT:
 * https://cse.lab.imtlucca.it/~bemporad/publications/papers/osqp-paper.pdf
 * Float64, finite numerical factors and the existing work budget do not imply
 * uniform accuracy or convergence. Original KKT admission remains independent
 * of downstream geometric, anatomical, Float32 and rendered acceptance.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Preserves the original constrained objective and every affine interval while admitting only an independently checked original-coordinate candidate.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains original native statuses, leading variables and signed original-row duals; a failed active-set guess cannot replace the preceding candidate or certify geometry.
 */
export function refineAutoMovieQuadraticProgram(
  input: Problem,
  initial: Native,
  options: IAutoMovieQuadraticRefinementOptions,
): IAutoMovieQuadraticRefinementResult {
  assembleAutoMovieQuadraticProgram(input);
  const count = input.diagonal.length;
  if (!(options.tolerance > 0) || !Number.isFinite(options.tolerance) ||
      !Number.isSafeInteger(options.maximumRefinements) || options.maximumRefinements < 0 ||
      initial.primal.length !== count || initial.dual.length !== input.rows.length)
    throw new Error("QP refinement needs complete values and an explicit finite work budget.");
  for (let at = 0; at < count; at++)
    if (!Number.isFinite(initial.primal[at]))
      throw new Error("QP refinement needs finite complete primal values.");
  for (let at = 0; at < input.rows.length; at++)
    if (!Number.isFinite(initial.dual[at]))
      throw new Error("QP refinement needs finite complete dual values.");
  const primal = initial.primal.slice(), dual = initial.dual.slice();
  if (initial.status === 1 && !Number.isFinite(objectiveValue(input, primal)))
    throw new Error("Original QP objective is not representable: " + JSON.stringify({
      status: initial.status, input, initial }));
  const groups = intervals(input);
  const first = residuals(input, primal, dual);
  const nativeCalls: IAutoMovieQuadraticRefinementNativeCall[] = [{
    status: initial.status, iterations: initial.iterations,
    primalResidual: initial.primalResidual, dualResidual: initial.dualResidual,
    scale: 1, objective: initial.objective, dualObjective: initial.dualObjective,
    gap: Math.abs(initial.objective - initial.dualObjective),
    originalGap: Math.abs(initial.objective - initial.dualObjective),
    rows: initial.dual.length, coordinates: "original",
    primal: initial.status === 1 ? undefined : primal.slice(),
    dual: initial.status === 1 ? undefined : dual.slice(),
  }];
  const base: IAutoMovieQuadraticRefinementResult = {
    primal, dual, status: initial.status, ...first,
    refinements: 0, reference: primal.slice(), originalRows: input.rows.length,
    presolvedRows: groups.length,
    rowGroups: groups.map((group) => group.originals.slice()), nativeCalls,
  };
  const admits = (reading: ReturnType<typeof residuals>): boolean =>
    reading.maximumViolation <= options.tolerance &&
    reading.stationarityResidual <= options.tolerance &&
    reading.complementarityResidual <= options.tolerance;
  if (initial.status !== 1 || options.maximumRefinements === 0 || admits(first))
    return base;
  const polishing = polishAutoMovieQuadraticProgram(input, initial, options, groups,
    (candidatePrimal, candidateDual) => {
      const reading = residuals(input, candidatePrimal, candidateDual);
      return Math.max(reading.maximumViolation, reading.stationarityResidual,
        reading.complementarityResidual);
    },
    (candidatePrimal, candidateDual) => gradientOf(input, candidatePrimal, candidateDual),
    (row, value, multiplier) => complementarityOf(input.rows[row], value, multiplier),
    first.maximumViolation <= options.tolerance &&
      first.complementarityResidual <= options.tolerance);
  base.refinements = polishing.iterations;
  const measured = residuals(input, polishing.primal, polishing.dual);
  if (polishing.primal.every(Number.isFinite) && polishing.dual.every(Number.isFinite) &&
      Number.isFinite(objectiveValue(input, polishing.primal)) && admits(measured)) {
    polishing.accepted = true;
    polishing.reason = "Every original numerical KKT condition passed.";
    return { ...base, primal: polishing.primal.slice(), dual: polishing.dual.slice(),
      ...measured, polishing };
  }
  return { ...base, polishing };
}

/** Read the unchanged original objective without relying on native diagnostics. */
function objectiveValue(input: Problem, primal: readonly number[]): number {
  let value = 0;
  for (let at = 0; at < input.diagonal.length; at++)
    value += ((input.diagonal[at] * primal[at]) * 0.5) * primal[at] +
      input.linear[at] * primal[at];
  return value;
}

/** Exact interval metadata; original rows and caller arrays remain unchanged. */
function intervals(input: Problem): Group[] {
  const groups: Group[] = [], byCoefficients = new Map<string, Group>();
  for (let at = 0; at < input.rows.length; at++) {
    const row = input.rows[at];
    const pairs = row.indices.map((id, column) => [id, row.weights[column]]).sort((a, b) => a[0] - b[0]);
    const key = JSON.stringify(pairs);
    let group = byCoefficients.get(key);
    if (group === undefined) {
      group = { indices: pairs.map((pair) => pair[0]), weights: pairs.map((pair) => pair[1]),
        lower: null, upper: null, lowerOwner: -1, upperOwner: -1, originals: [] };
      groups.push(group); byCoefficients.set(key, group);
    }
    group.originals.push(at);
    if (row.lower !== null && (group.lower === null || row.lower > group.lower)) {
      group.lower = row.lower; group.lowerOwner = at;
    }
    if (row.upper !== null && (group.upper === null || row.upper < group.upper)) {
      group.upper = row.upper; group.upperOwner = at;
    }
    if (group.lower !== null && group.upper !== null && group.lower > group.upper)
      throw new Error("Exact QP interval intersection is empty: " + JSON.stringify({
        originals: group.originals, lower: group.lower, upper: group.upper, input }));
  }
  return groups;
}

/** Admission in original row units and the original signed-dual convention. */
function residuals(input: Problem, primal: readonly number[], dual: readonly number[]) {
  const gradient = gradientOf(input, primal, dual);
  let maximumViolation = 0, complementarityResidual = 0;
  for (let at = 0; at < input.rows.length; at++) {
    const row = input.rows[at], multiplier = dual[at];
    const value = row.indices.reduce((sum, id, column) => sum + row.weights[column] * primal[id], 0);
    maximumViolation = Math.max(maximumViolation,
      row.lower === null ? 0 : row.lower - value, row.upper === null ? 0 : value - row.upper);
    complementarityResidual = Math.max(complementarityResidual,
      complementarityOf(row, value, multiplier));
  }
  let stationarityResidual = 0;
  for (const value of gradient) stationarityResidual = Math.max(stationarityResidual, Math.abs(value));
  return { maximumViolation, stationarityResidual, complementarityResidual };
}

/** Original stationarity formula shared by admission and numerical correction. */
function gradientOf(input: Problem, primal: readonly number[], dual: readonly number[]): number[] {
  const gradient = input.linear.map((value, column) => value + input.diagonal[column] * primal[column]);
  for (let at = 0; at < input.rows.length; at++) {
    const row = input.rows[at];
    for (let corner = 0; corner < row.indices.length; corner++)
      gradient[row.indices[corner]] += dual[at] * row.weights[corner];
  }
  return gradient;
}

/** Original endpoint/null-bound convention, also used to verify dual projection. */
function complementarityOf(row: Problem["rows"][number], value: number, multiplier: number): number {
  if (row.lower !== null && row.lower === row.upper) return 0;
  const bound = multiplier >= 0 ? row.upper : row.lower;
  return bound === null ? Math.abs(multiplier) : Math.abs(multiplier * (value - bound));
}
