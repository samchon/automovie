import { createAutoMovieQuadraticConstraintBasis } from "./createAutoMovieQuadraticConstraintBasis";
import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import type { IAutoMovieQuadraticWorkingSetStep } from "./IAutoMovieQuadraticWorkingSetStep";

/**
 * Minimize the unchanged diagonal PSD objective on an independent working space.
 * Householder QR of sqrt(H)*Z avoids a Schur normal-equation factor. Exact flat
 * columns retain their coordinate when their linear term is zero; otherwise a
 * zero-curvature descent direction requires the caller's complete-row blocker.
 * Other numerical rank ambiguity refuses without removing a constraint or adding
 * objective curvature. The caller retains its feasible native state and alone
 * checks the original full KKT. Gill and Wong (2014), sections 2-3:
 * https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf
 * The finite arithmetic and rank test establish no convergence guarantee.
 * A normal projection at the affine origin is a separate least-residual dual
 * candidate, even when a flat direction prevents a working-space minimum.
 * It is not a second-order-consistent LP basis or a subspace-optimum certificate.
 * Column-pivoted QR's A*P=Q*R convention is documented by LAPACK DGEQP3:
 * https://www.netlib.org/lapack/double/dgeqp3.f
 * An unavailable normal projection leaves a valid flat continuation available.
 * Inputs are borrowed after the refinement owner's complete QP validation;
 * owned dense coordinates have finite-memory limits, not full-row scalability.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Uses the original diagonal and linear objective without a lasting ridge or relaxed interval.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Returns original working multipliers and numerical refusal separately from full original-row adoption.
 * @author Samchon
 */
export function solveAutoMovieQuadraticWorkingSetStep(
  diagonal: readonly number[],
  linear: readonly number[],
  rows: readonly IAutoMovieQuadraticRow[],
  bounds: readonly number[],
  free: readonly boolean[],
  preceding: readonly number[],
): IAutoMovieQuadraticWorkingSetStep {
  const basis = createAutoMovieQuadraticConstraintBasis(rows, bounds, free, diagonal.length);
  const result: IAutoMovieQuadraticWorkingSetStep = {
    primal: null, origin: null, flatDirection: null, normalDual: null, dual: null,
    basis, reducedRank: 0, refusal: basis.refusal,
  };
  const fail = (reason: string): IAutoMovieQuadraticWorkingSetStep => {
    result.refusal = reason; return result;
  };
  if (basis.refusal !== null) return result;
  try {
    const dot = (a: readonly number[], b: readonly number[]): number => {
      let value = 0;
      for (let at = 0; at < a.length; at++) value += a[at] * b[at];
      return value;
    };
    const projectDual = (values: readonly number[]): number[] | null => {
      try {
        const originalGradient = linear.map((value, at) => value + diagonal[at] * values[at]);
        if (!originalGradient.every(Number.isFinite)) return null;
        // A_W' P D^-1 = Q R: R*c = -Q'g, y_W = P D^-1 c.
        // The unrepresented normal component remains for original KKT admission.
        const multipliers = basis.range.map((column) => -dot(column, originalGradient));
        for (let row = basis.rank - 1; row >= 0; row--) {
          let value = multipliers[row];
          for (let column = row + 1; column < basis.rank; column++)
            value -= basis.triangular[row][column] * multipliers[column];
          multipliers[row] = value / basis.triangular[row][row];
        }
        const projected = new Array<number>(rows.length).fill(0);
        for (let at = 0; at < basis.rank; at++)
          projected[basis.order[at]] = multipliers[at] / basis.divisors[at];
        return projected.every(Number.isFinite) ? projected : null;
      } catch (error: unknown) {
        if (error instanceof RangeError) return null;
        throw error;
      }
    };
    const origin = basis.particular.slice();
    const difference = preceding.map((value, at) => value - origin[at]);
    for (const column of basis.nullspace) {
      const coordinate = dot(column, difference);
      for (let at = 0; at < origin.length; at++) origin[at] += column[at] * coordinate;
    }
    if (!origin.every(Number.isFinite)) return fail("working-affine-origin-not-representable");
    result.origin = origin;
    result.normalDual = projectDual(origin);
    const gradient = linear.map((value, at) => value + diagonal[at] * origin[at]);
    const indices = diagonal.map((_, at) => at);
    const objectiveRows: IAutoMovieQuadraticRow[] = [], retained: number[] = [];
    const projectedFlatLinear: number[] = [];
    const objectiveTarget = diagonal.map((value, at) => value === 0 ? 0
      : Math.sqrt(value) * origin[at] + linear[at] / Math.sqrt(value));
    const flatLinear = linear.map((value, at) => diagonal[at] === 0 ? value : 0);
    if (!objectiveTarget.every(Number.isFinite)) return fail("working-objective-target-not-representable");
    for (let at = 0; at < basis.nullspace.length; at++) {
      const column = basis.nullspace[at];
      const value = dot(column, gradient);
      if (!Number.isFinite(value)) return fail("working-projected-objective-not-representable");
      const curved = column.some((coefficient, i) => diagonal[i] > 0 && coefficient !== 0);
      if (!curved) {
        if (value !== 0) {
          result.flatDirection = column.map((coefficient) => value > 0 ? -coefficient : coefficient);
          return result;
        }
        continue;
      }
      const weights = column.map((coefficient, i) => Math.sqrt(diagonal[i]) * coefficient);
      if (!weights.every(Number.isFinite) ||
          weights.some((coefficient, i) => coefficient === 0 && diagonal[i] > 0 && column[i] !== 0))
        return fail("working-positive-curvature-underflow-or-overflow");
      objectiveRows.push({ indices, weights, lower: null, upper: null });
      retained.push(at); projectedFlatLinear.push(dot(column, flatLinear));
    }
    const curvature = createAutoMovieQuadraticConstraintBasis(
      objectiveRows, objectiveRows.map(() => 0), objectiveRows.map(() => false), diagonal.length,
    );
    result.reducedRank = curvature.rank;
    if (curvature.refusal !== null) return fail("working-reduced-curvature: " + curvature.refusal);
    const count = curvature.rank, coordinates = new Array<number>(count).fill(0);
    // B P D^-1 = Q R. Curved terms use Q' times the original LS target,
    // avoiding a normal-equation RHS. Only genuine zero-H linear terms need
    // R' v = -D^-1 P' Z'q_flat. No objective term or curvature is invented.
    for (let row = 0; row < count; row++) {
      let value = -projectedFlatLinear[curvature.order[row]] / curvature.divisors[row];
      for (let column = 0; column < row; column++) value -= curvature.triangular[column][row] * coordinates[column];
      coordinates[row] = value / curvature.triangular[row][row];
    }
    for (let row = 0; row < count; row++) coordinates[row] -= dot(curvature.range[row], objectiveTarget);
    for (let row = count - 1; row >= 0; row--) {
      let value = coordinates[row];
      for (let column = row + 1; column < count; column++) value -= curvature.triangular[row][column] * coordinates[column];
      coordinates[row] = value / curvature.triangular[row][row];
    }
    const primal = origin.slice();
    for (let column = 0; column < count; column++) {
      const amount = coordinates[column] / curvature.divisors[column];
      const vector = basis.nullspace[retained[curvature.order[column]]];
      for (let at = 0; at < primal.length; at++) primal[at] += amount * vector[at];
    }
    const dual = projectDual(primal);
    if (!primal.every(Number.isFinite) || dual === null)
      return fail("working-objective-candidate-not-representable");
    result.primal = primal; result.dual = dual;
    return result;
  } catch (error: unknown) {
    return fail("working-step-representation-refused: " + (error instanceof Error ? error.message : String(error)));
  }
}
