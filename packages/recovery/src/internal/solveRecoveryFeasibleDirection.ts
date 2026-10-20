import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";
import { adjacentAutoMovieFloat64 } from "@automovie/engine/math/adjacentAutoMovieFloat64";
import type { IAutoMovieSimplexBudget } from "@automovie/engine/math/IAutoMovieSimplexBudget";
import { minimizeAutoMovieSimplexQuadratic } from "@automovie/engine/math/minimizeAutoMovieSimplexQuadratic";

import type { IAutoMovieRecoveryFeasibleDirection } from "../structures/internal/IAutoMovieRecoveryFeasibleDirection";
import type { IAutoMovieRecoveryFeasibleArithmetic } from "../structures/internal/IAutoMovieRecoveryFeasibleArithmetic";
import { measureRecoveryFeasibleArithmetic } from "./measureRecoveryFeasibleArithmetic";

/**
 * Solve a pure tilted feasible-direction model in common metric coordinates.
 * The first atom is the actual objective gradient with zero offset. Each later
 * atom is an unweighted inequality gradient with offset minus its feasible g.
 * Min half ||d||^2+gamma subject to a_i*d-gamma<=offset_i has simplex dual
 * min half ||sum(lambda_i*a_i)||^2+sum(lambda_i*offset_i).
 *
 * @evidence contracts/common.md#principled-implementation The full simplex dual produces d=-sum(lambda*a), gamma=-min(a dot aggregate+offset). This is the same PSD pure-gamma QP as the existing numerical primitive, without extra auxiliary curvature. Strictly negative certified gamma gives objective descent and strict inward derivatives for active C1 constraints, not full nonlinear feasibility.
 * @evidence contracts/common.md#clear-and-simple-design Recovery owns the objective/constraint interpretation and full original-row certificate; generic sparse convex minimization belongs to engine. Actual retraction, rank, gauge, point gates and nonlinear stationarity remain with the fitting owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No threshold relaxation, removed row, sampled constraint, abnormal-zero success or unbudgeted native solve supplies a direction. Iteration/work exhaustion remains uncertified. Stalled numerical qualification records actual-row failures separately from normalized-dual forward-error bounds and never supplies nonlinear convergence.
 * @evidence contracts/common.md#meaningful-documentation Defines row order, feasible offsets, metric coordinates and limited local inwardness. Actual returned-row residuals/qualification remain distinct from an outward-bounded normalized-dual reconstruction allowance. A stalled numerical certificate does not meet the requested sub-ulp gap or change nonlinear pixel/KKT tolerances.
 * @evidence contracts/performance.md#efficient-algorithms With n coordinates, m rows and Z sparse coefficients, bounded pairwise minimization costs O(I*(n+m+Z)); complete certificate and forward-error scans cost O(n+m+Z), reserved as 256Z+1024m+128n+1024 visits, including fixed outward-neighbour work even for empty atoms. Its storage is O(n+m+Z) plus 128 reserved fixed slots, avoiding dense full-dimensional active factors.
 * @evidence contracts/performance.md#reuse-equivalent-work The same immutable rows supply dual minimization and original-row checks. No fit, expected answer or previous geometry is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Budgeted local arrays expire or transfer as owned step/multipliers. No image, native reactor, callback history or external handle remains.
 */
export function solveRecoveryFeasibleDirection(
  width: number,
  rows: readonly IAutoMovieSimplexAtom[],
  tolerance: number,
  budget: IAutoMovieSimplexBudget,
  charge: (work: number) => void = (): void => {},
): IAutoMovieRecoveryFeasibleDirection {
  const metadataWork: number = 4 * rows.length;
  if (!Number.isSafeInteger(budget.maxWork) || metadataWork >= budget.maxWork)
    throw new Error("camera-feasible: bounded metadata admission required");
  charge(metadataWork);
  if (
    rows[0]?.offset !== 0 ||
    rows.some((row: IAutoMovieSimplexAtom): boolean => !(row.offset >= 0))
  )
    throw new Error(
      "camera-feasible: objective first and feasible constraint offsets required",
    );
  const certificateWork: number =
    256 *
      rows.reduce(
        (sum: number, row: IAutoMovieSimplexAtom): number =>
          sum + row.indices.length,
        0,
      ) +
    1024 * rows.length +
    128 * width + 1024;
  if (
    !Number.isSafeInteger(certificateWork) ||
    metadataWork + certificateWork >= budget.maxWork ||
    width + 128 >= budget.maxEntries
  )
    throw new Error("camera-feasible: complete certificate work required");
  const solution: ReturnType<typeof minimizeAutoMovieSimplexQuadratic> =
    minimizeAutoMovieSimplexQuadratic(
      width,
      rows,
      tolerance,
      {
        ...budget,
        maxWork: budget.maxWork - metadataWork - certificateWork,
        maxEntries: budget.maxEntries - width - 128,
      },
      charge,
    );
  charge(certificateWork);
  const reconstruction: IAutoMovieRecoveryFeasibleArithmetic =
    measureRecoveryFeasibleArithmetic(rows, solution);
  const step: number[] = solution.aggregate.map(
    (value: number): number => -value,
  );
  const gamma: number = -solution.minimumPrice;
  // The minimizer transfers this owned array; reuse it for an independent
  // original-QP stationarity reconstruction without another width allocation.
  for (let axis: number = 0; axis < width; axis++) solution.aggregate[axis] = step[axis]!;
  let maximumViolation: number = 0,
    complementarity: number = 0, arithmeticAllowance: number = 0;
  let stationarityScale: number = step.reduce(
    (maximum: number, value: number): number => Math.max(maximum, Math.abs(value)), 0);
  let rowsQualified: boolean = true, reconstructionRowsQualified: boolean = true;
  for (let at: number = 0; at < rows.length; at++) {
    const row: IAutoMovieSimplexAtom = rows[at]!;
    const slack: number = row.indices.reduce(
      (sum: number, axis: number, entry: number): number =>
        sum + row.values[entry]! * step[axis]!,
      -gamma - row.offset,
    );
    const absoluteTerms: number = row.indices.reduce(
      (total: number, axis: number, entry: number): number =>
        total + Math.abs(row.values[entry]! * step[axis]!), Math.abs(gamma) + row.offset);
    const allowance: number = 64 * Number.EPSILON * (row.indices.length + 1) * absoluteTerms;
    const rowNorm: number = row.values.reduce((total: number, value: number): number => adjacentAutoMovieFloat64(total + Math.abs(value), true), 0);
    const reconstructionAllowance: number = adjacentAutoMovieFloat64(allowance + adjacentAutoMovieFloat64(adjacentAutoMovieFloat64(rowNorm * reconstruction.aggregate, true) + reconstruction.minimumPrice, true), true);
    arithmeticAllowance = Math.max(arithmeticAllowance, allowance);
    rowsQualified &&= Number.isFinite(allowance) && slack <= tolerance + allowance &&
      Math.abs(solution.weights[at]! * slack) <= tolerance + allowance;
    reconstructionRowsQualified &&= Number.isFinite(reconstructionAllowance) &&
      slack <= tolerance + reconstructionAllowance &&
      Math.abs(solution.weights[at]! * slack) <= tolerance + adjacentAutoMovieFloat64(Math.max(1, solution.weights[at]!) * reconstructionAllowance, true);
    let rowMaximum: number = 0;
    for (let entry: number = 0; entry < row.indices.length; entry++) {
      const value: number = solution.weights[at]! * row.values[entry]!;
      solution.aggregate[row.indices[entry]!]! += value;
      rowMaximum = Math.max(rowMaximum, Math.abs(value));
    }
    stationarityScale += rowMaximum;
    maximumViolation = Math.max(maximumViolation, slack);
    complementarity = Math.max(
      complementarity,
      Math.abs(solution.weights[at]! * slack),
    );
  }
  const sum: number = solution.weights.reduce(
    (total: number, value: number): number => total + value,
    0,
  );
  const objective: number = step.reduce(
    (total: number, value: number): number => total + 0.5 * value * value,
    gamma,
  );
  const stationarityResidual: number = solution.aggregate.reduce(
    (maximum: number, value: number): number => Math.max(maximum, Math.abs(value)), 0);
  const stationarityAllowance: number = 64 * Number.EPSILON * (rows.length + 1) * stationarityScale;
  const roundoffCandidate: boolean = solution.termination === "stalled" &&
    solution.gap <= tolerance + reconstruction.gap;
  const numericalChecks: boolean = step.every(Number.isFinite) &&
    [gamma, objective, maximumViolation, complementarity].every(Number.isFinite) &&
    Math.abs(sum - 1) <= 64 * Number.EPSILON * rows.length &&
    Number.isFinite(stationarityAllowance) && Number.isFinite(stationarityResidual) &&
    stationarityResidual <= tolerance + stationarityAllowance &&
    solution.weights.every((value: number): boolean => value >= 0);
  const gapUpperBound: number = adjacentAutoMovieFloat64(solution.gap + reconstruction.gap, true);
  return {
    termination: solution.termination,
    step,
    gamma,
    multipliers: solution.weights,
    objective,
    gap: solution.gap,
    maximumViolation,
    complementarity,
    arithmeticAllowance,
    simplexResidual: Math.abs(sum - 1),
    stationarityResidual,
    stationarityAllowance,
    returnedRowsQualified: rowsQualified,
    reconstructionRowsQualified,
    aggregateAllowance: reconstruction.aggregate,
    minimumPriceAllowance: reconstruction.minimumPrice,
    gapAllowance: reconstruction.gap,
    gapUpperBound,
    exactGapTargetMet: gapUpperBound <= tolerance,
    roundoffLimited: roundoffCandidate && numericalChecks && reconstructionRowsQualified,
    certified:
      numericalChecks && ((solution.converged && rowsQualified) ||
        (roundoffCandidate && reconstructionRowsQualified)),
    iterations: solution.iterations,
    work: metadataWork + solution.work + certificateWork,
  };
}
