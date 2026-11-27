import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryFeasibleArithmetic,
  IAutoMovieRecoveryFeasibleDirection,
  IAutoMovieSimplexAtom,
  IAutoMovieSimplexBudget,
} from "@automovie/interface";

import { measureRecoveryFeasibleArithmetic } from "../observation/internal/measureRecoveryFeasibleArithmetic";

/**
 * Solve a pure tilted feasible-direction model in common metric coordinates.
 * The first atom is the actual objective gradient with zero offset. Each later
 * atom is an unweighted inequality gradient with offset minus its feasible g.
 * Min half ||d||^2+gamma subject to a_i_d-gamma<=offset_i has simplex dual min
 * half ||sum(lambda_i_a_i)||^2+sum(lambda_i*offset_i).
 */
export function solveRecoveryFeasibleDirection(
  width: number,
  rows: readonly IAutoMovieSimplexAtom[],
  tolerance: number,
  budget: IAutoMovieSimplexBudget,
  charge: (work: number) => void = (): void => {},
): IAutoMovieRecoveryFeasibleDirection {
  const metadataWork: number = 4 * rows.length;
  if (metadataWork >= budget.maxWork)
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
    128 * width +
    1024;
  if (
    metadataWork + certificateWork >= budget.maxWork ||
    width + 128 >= budget.maxEntries
  )
    throw new Error("camera-feasible: complete certificate work required");
  const solution: ReturnType<typeof AutoMovieEngineMath.minimizeSimplexQuadratic> =
    AutoMovieEngineMath.minimizeSimplexQuadratic(
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
  for (let axis: number = 0; axis < width; axis++)
    solution.aggregate[axis] = step[axis]!;
  let maximumViolation: number = 0,
    complementarity: number = 0,
    arithmeticAllowance: number = 0;
  let stationarityScale: number = step.reduce(
    (maximum: number, value: number): number =>
      Math.max(maximum, Math.abs(value)),
    0,
  );
  let rowsQualified: boolean = true,
    reconstructionRowsQualified: boolean = true;
  for (let at: number = 0; at < rows.length; at++) {
    const row: IAutoMovieSimplexAtom = rows[at]!;
    const slack: number = row.indices.reduce(
      (sum: number, axis: number, entry: number): number =>
        sum + row.values[entry]! * step[axis]!,
      -gamma - row.offset,
    );
    const absoluteTerms: number = row.indices.reduce(
      (total: number, axis: number, entry: number): number =>
        total + Math.abs(row.values[entry]! * step[axis]!),
      Math.abs(gamma) + row.offset,
    );
    const allowance: number =
      64 * Number.EPSILON * (row.indices.length + 1) * absoluteTerms;
    const rowNorm: number = row.values.reduce(
      (total: number, value: number): number =>
        AutoMovieEngineMath.adjacentFloat64(total + Math.abs(value), true),
      0,
    );
    const reconstructionAllowance: number = AutoMovieEngineMath.adjacentFloat64(
      allowance +
        AutoMovieEngineMath.adjacentFloat64(
          AutoMovieEngineMath.adjacentFloat64(rowNorm * reconstruction.aggregate, true) +
            reconstruction.minimumPrice,
          true,
        ),
      true,
    );
    arithmeticAllowance = Math.max(arithmeticAllowance, allowance);
    // An overflowing allowance bounds nothing, so it qualifies no row.
    rowsQualified &&=
      allowance !== Infinity &&
      reconstructionAllowance !== Infinity &&
      slack <= tolerance + allowance &&
      Math.abs(solution.weights[at]! * slack) <= tolerance + allowance;
    reconstructionRowsQualified &&=
      slack <= tolerance + reconstructionAllowance &&
      Math.abs(solution.weights[at]! * slack) <=
        tolerance +
          AutoMovieEngineMath.adjacentFloat64(
            Math.max(1, solution.weights[at]!) * reconstructionAllowance,
            true,
          );
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
    (maximum: number, value: number): number =>
      Math.max(maximum, Math.abs(value)),
    0,
  );
  const stationarityAllowance: number =
    64 * Number.EPSILON * (rows.length + 1) * stationarityScale;
  const roundoffCandidate: boolean =
    solution.termination === "stalled" &&
    solution.gap <= tolerance + reconstruction.gap;
  const unbounded: (value: number) => boolean = (value: number): boolean =>
    value === Infinity || value === -Infinity;
  const numericalChecks: boolean =
    !step.some(unbounded) &&
    ![gamma, objective, maximumViolation, complementarity].some(unbounded) &&
    Math.abs(sum - 1) <= 64 * Number.EPSILON * rows.length &&
    stationarityAllowance !== Infinity &&
    stationarityResidual <= tolerance + stationarityAllowance &&
    solution.weights.every((value: number): boolean => value >= 0);
  const gapUpperBound: number = AutoMovieEngineMath.adjacentFloat64(
    solution.gap + reconstruction.gap,
    true,
  );
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
    roundoffLimited:
      roundoffCandidate && numericalChecks && reconstructionRowsQualified,
    certified:
      numericalChecks &&
      ((solution.converged && rowsQualified) ||
        (roundoffCandidate && reconstructionRowsQualified)),
    iterations: solution.iterations,
    work: metadataWork + solution.work + certificateWork,
  };
}
