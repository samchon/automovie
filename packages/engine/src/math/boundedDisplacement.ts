/**
 * Constraint generation for minimum squared nonnegative displacement. A solve
 * retains all vertex bounds and a growing subset of affine contact conditions.
 * Every original row is checked after every solve. If the restricted minimizer
 * is feasible for the full problem, it is also a full minimizer up to the stated
 * numerical residual. Grouping chooses work order, never which contacts count.
 * Geometry and physical units belong to the caller; no tissue model is inferred.
 */
import {
  type IAutoMovieQuadraticRow,
  assembleAutoMovieQuadraticProgram,
  solveAutoMovieQuadraticProgram,
} from "./quadraticProgram";

/**
 * Minimize 1/2 sum(mass[i] * travel[i]^2) with 0 <= travel <= upper and every
 * supplied row. Masses are strictly positive. Each row has a grouping identity
 * used to add its group's worst unsatisfied condition per round. Row order
 * breaks equal-error ties deterministically. The all-zero start is the exact
 * unconstrained minimum, so an already-clear problem needs no native solve.
 *
 * Inputs must be scaled by the caller into suitable numerical units. Tolerance
 * is a positive absolute row-value error in those units, not anatomical slack.
 * Maximum rounds is a positive integer work budget. Infeasibility, an exhausted
 * budget or a residual that fails on already selected rows throws with native
 * status, residual and round count. This owner admits displacement before any
 * geometry consumer can apply it; no relaxed bound or objective is substituted.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Jointly minimizes area-weighted geometric travel while retaining complete contact constraints and conservative per-vertex upper bounds.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Checks all original affine conditions after each restricted solve and preserves native failure and residual information before geometry can be accepted.
 */
export function solveAutoMovieBoundedDisplacement(input: {
  mass: readonly number[];
  upper: readonly number[];
  constraints: readonly { row: IAutoMovieQuadraticRow; group: number }[];
  tolerance: number;
  maximumRounds: number;
}): {
  travel: number[];
  violation: number;
  rounds: number;
  status: number | null;
} {
  if (
    !Number.isFinite(input.tolerance) ||
    input.tolerance <= 0 ||
    !Number.isSafeInteger(input.maximumRounds) ||
    input.maximumRounds <= 0
  )
    throw new Error(
      "Displacement needs positive tolerance and integer round budget.",
    );
  if (
    input.upper.length !== input.mass.length ||
    input.mass.some((value) => value <= 0)
  )
    throw new Error(
      "Displacement needs positive masses and matching upper bounds.",
    );
  const bounds = Array.from(input.upper, (upper, i) => ({
    indices: [i],
    weights: [1],
    lower: 0,
    upper,
  }));
  const problem = {
    diagonal: input.mass,
    linear: input.mass.map(() => 0),
    rows: [...input.constraints.map(({ row }) => row), ...bounds],
    initial: input.upper,
  };
  // Use the same admission as the full QP, including currently clear rows.
  assembleAutoMovieQuadraticProgram(problem);
  const selected = new Set<number>();
  let travel = input.mass.map(() => 0),
    status: number | null = null;
  for (let rounds = 0; ; rounds++) {
    let violation = 0;
    const worst = new Map<number, { index: number; error: number }>();
    for (let i = 0; i < input.constraints.length; i++) {
      const { row, group } = input.constraints[i];
      const value = row.indices.reduce(
        (sum, id, j) => sum + row.weights[j] * travel[id],
        0,
      );
      const error = Math.max(
        0,
        row.lower === null ? 0 : row.lower - value,
        row.upper === null ? 0 : value - row.upper,
      );
      violation = Math.max(violation, error);
      if (selected.has(i) || error <= input.tolerance) continue;
      const previous = worst.get(group);
      if (previous === undefined || error > previous.error)
        worst.set(group, { index: i, error });
    }
    if (violation <= input.tolerance)
      return { travel, violation, rounds, status };
    if (rounds === input.maximumRounds || worst.size === 0)
      throw new Error(
        `Bounded displacement did not converge: status ${status}, residual ${violation}, rounds ${rounds}.`,
      );
    for (const { index } of worst.values()) selected.add(index);
    const solved = solveAutoMovieQuadraticProgram({
      ...problem,
      rows: [...selected].map((i) => input.constraints[i].row).concat(bounds),
    });
    status = solved.status;
    if (status !== 1)
      throw new Error(
        `Bounded displacement solve failed: status ${status}, residual ${solved.maximumViolation}, rounds ${rounds + 1}.`,
      );
    // Roundoff cannot spend more than the caller's cap or retreat into a support.
    // Recheck all original rows on these exact returned values next iteration.
    travel = solved.primal.map((value, i) =>
      Math.max(0, Math.min(input.upper[i], value)),
    );
  }
}
