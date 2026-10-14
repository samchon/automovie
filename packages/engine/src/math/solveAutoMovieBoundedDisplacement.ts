import { type IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import { admitAutoMovieQuadraticProgram } from "./admitAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticProgram } from "./solveAutoMovieQuadraticProgram";

/**
 * Constraint generation for minimum squared nonnegative displacement. A solve
 * retains all vertex bounds and a growing subset of affine contact conditions.
 * Every original row is checked after every solve. If the restricted minimizer
 * is feasible for the full problem, it is also a full minimizer up to the stated
 * numerical residual. Grouping chooses work order, never which contacts count.
 * Geometry and physical units belong to the caller; no tissue model is inferred.
 */

/**
 * Minimize 1/2 sum(mass[i] * travel[i]^2) with 0 <= travel <= upper and every
 * supplied row. Masses are strictly positive. Each row has a grouping identity
 * used to add its group's worst unsatisfied condition per round. Row order
 * breaks equal-error ties deterministically. The all-zero start is the exact
 * unconstrained minimum, so an already-clear problem needs no native solve.
 *
 * Inputs must be scaled by the caller into suitable numerical units. Tolerance
 * is a positive absolute row-value error in those units, not anatomical slack.
 * Maximum rounds is a positive integer work budget. An unsatisfied restricted
 * problem with no participating variable refuses before numerical iteration.
 * Native failure, an exhausted budget
 * or a residual that fails on already selected rows throws with native status,
 * residual and round count. This owner admits displacement before any
 * geometry consumer can apply it; no relaxed bound or objective is substituted.
 *
 * @evidence contracts/common.md#principled-implementation Constraint generation solves positive diagonal squared travel under box bounds and selected contacts; full-row feasibility admits restricted minima, and uninvolved coordinates retain their exact zero optimum.
 * @evidence contracts/common.md#clear-and-simple-design This owner handles worst-per-group insertion and reconstruction; the shared QP solver owns factors and kernel work while callers supply geometry and units.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Groups order work rather than dropping contacts; original rows are checked on exact clipped outputs, and exhausted budgets or constant contradictions refuse.
 * @evidence contracts/common.md#meaningful-documentation States positive masses, caps, grouping/ties, zero start, caller scaling, absolute tolerance, finite rounds and native/convergence diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms For B rounds and Z coefficients, each round scans all contacts in O(Z) and solves only selected incident coordinates; selected population is bounded by original constraints.
 * @evidence contracts/performance.md#reuse-equivalent-work Selected rows accumulate across rounds and absent-coordinate minima remain zeros; no global solution survives changed inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Selected sets and reduced rows are bounded by input dimensions; delegated workspaces release on failure or completion, and only final travel/diagnostics escape.
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
    input.mass.some((value: number): boolean => value <= 0)
  )
    throw new Error(
      "Displacement needs positive masses and matching upper bounds.",
    );
  const bounds: {
    indices: number[];
    weights: number[];
    lower: number;
    upper: number;
  }[] = Array.from(
    input.upper,
    (
      upper: number,
      i: number,
    ): {
      indices: number[];
      weights: number[];
      lower: number;
      upper: number;
    } => ({
      indices: [i],
      weights: [1],
      lower: 0,
      upper,
    }),
  );
  const problem: {
    diagonal: readonly number[];
    linear: number[];
    rows: IAutoMovieQuadraticRow[];
    initial: readonly number[];
  } = {
    diagonal: input.mass,
    linear: input.mass.map((): number => 0),
    rows: [
      ...input.constraints.map(
        ({
          row,
        }: {
          row: IAutoMovieQuadraticRow;
          group: number;
        }): IAutoMovieQuadraticRow => row,
      ),
      ...bounds,
    ],
    initial: input.upper,
  };
  // Use the same admission as the full QP, including currently clear rows.
  admitAutoMovieQuadraticProgram(problem);
  const selected: Set<number> = new Set<number>();
  let travel: number[] = input.mass.map((): number => 0),
    status: number | null = null;
  for (let rounds: number = 0; ; rounds++) {
    let violation: number = 0;
    const worst: Map<number, { index: number; error: number }> = new Map<
      number,
      { index: number; error: number }
    >();
    for (let i: number = 0; i < input.constraints.length; i++) {
      const { row, group }: { row: IAutoMovieQuadraticRow; group: number } =
        input.constraints[i];
      const value: number = row.indices.reduce(
        (sum: number, id: number, j: number): number =>
          sum + row.weights[j] * travel[id],
        0,
      );
      const error: number = Math.max(
        0,
        row.lower === null ? 0 : row.lower - value,
        row.upper === null ? 0 : value - row.upper,
      );
      violation = Math.max(violation, error);
      if (selected.has(i) || error <= input.tolerance) continue;
      const previous: { index: number; error: number } | undefined =
        worst.get(group);
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
    const rows: IAutoMovieQuadraticRow[] = [...selected].map(
      (i: number): IAutoMovieQuadraticRow => input.constraints[i].row,
    );
    // This restricted objective is diagonal with positive mass and zero linear
    // cost. A variable absent from every selected affine row has the exact
    // minimizer zero inside its [0, cap] interval. Eliminate that independent
    // block before numerical iteration: an interior-point barrier otherwise
    // leaves sqrt(energy error) travel near its zero optimum. Exact zero weights
    // do not couple variables; every nonzero weight, however small, does.
    const incident: Set<number> = new Set<number>();
    for (const row of rows)
      for (let j: number = 0; j < row.indices.length; j++)
        if (row.weights[j] !== 0) incident.add(row.indices[j]);
    const variables: number[] = input.mass
      .map((_: number, i: number): number => i)
      .filter((i: number): boolean => incident.has(i));
    if (variables.length === 0)
      throw new Error("Bounded displacement has inconsistent constant rows.");
    const lookup: Map<number, number> = new Map(
      variables.map((id: number, i: number): [number, number] => [id, i]),
    );
    const solved: {
      status: number;
      iterations: number;
      primalResidual: number;
      dualResidual: number;
      objective: number;
      dualObjective: number;
      primal: number[];
      dual: number[];
    } & { maximumViolation: number; stationarityResidual: number } =
      solveAutoMovieQuadraticProgram({
        diagonal: variables.map((id: number): number => input.mass[id]),
        linear: variables.map((): number => 0),
        rows: rows
          .map(
            (
              row: IAutoMovieQuadraticRow,
            ): {
              indices: number[];
              weights: number[];
              lower: number | null;
              upper: number | null;
            } => {
              const columns: { id: number; weight: number }[] = row.indices
                .map(
                  (id: number, j: number): { id: number; weight: number } => ({
                    id,
                    weight: row.weights[j],
                  }),
                )
                .filter(
                  ({ weight }: { id: number; weight: number }): boolean =>
                    weight !== 0,
                );
              return {
                ...row,
                indices: columns.map(
                  ({ id }: { id: number; weight: number }): number =>
                    lookup.get(id)!,
                ),
                weights: columns.map(
                  ({ weight }: { id: number; weight: number }): number =>
                    weight,
                ),
              };
            },
          )
          .concat(
            variables.map(
              (
                id: number,
                i: number,
              ): {
                indices: number[];
                weights: number[];
                lower: number;
                upper: number;
              } => ({ ...bounds[id], indices: [i] }),
            ),
          ),
      });
    status = solved.status;
    if (status !== 1)
      throw new Error(
        `Bounded displacement solve failed: status ${status}, residual ${solved.maximumViolation}, rounds ${rounds + 1}.`,
      );
    // Roundoff cannot spend more than the caller's cap or retreat into a support.
    // Recheck all original rows on these exact returned values next iteration.
    travel = input.mass.map((): number => 0);
    for (let i: number = 0; i < variables.length; i++) {
      const id: number = variables[i];
      travel[id] = Math.max(0, Math.min(input.upper[id], solved.primal[i]));
    }
  }
}
