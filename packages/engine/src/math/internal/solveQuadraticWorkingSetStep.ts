import type {
  IAutoMovieQuadraticConstraintBasis,
  IAutoMovieQuadraticRow,
  IAutoMovieQuadraticWorkingSetStep,
} from "@automovie/interface";

import { createQuadraticConstraintBasis } from "./createQuadraticConstraintBasis";

/*
 * Minimize the unchanged diagonal PSD objective on an independent working
 * space. Householder QR of sqrt(H)_Z avoids a Schur normal-equation factor.
 * Exact flat columns retain their coordinate when their linear term is zero;
 * otherwise a zero-curvature descent direction requires the caller's
 * complete-row blocker. Other numerical rank ambiguity refuses without removing
 * a constraint or adding objective curvature. The caller retains its feasible
 * native state and alone checks the original full KKT. Gill and Wong (2014),
 * sections 2-3: https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf The finite
 * arithmetic and rank test establish no convergence guarantee. A normal
 * projection at the affine origin is a separate least-residual dual candidate,
 * even when a flat direction prevents a working-space minimum. It is not a
 * second-order-consistent LP basis or a subspace-optimum certificate.
 * Column-pivoted QR's A_P=Q*R convention is documented by LAPACK DGEQP3:
 * https://www.netlib.org/lapack/double/dgeqp3.f An unavailable normal
 * projection leaves a valid flat continuation available. Inputs are borrowed
 * after the refinement owner's complete QP validation; owned dense coordinates
 * have finite-memory limits, not full-row scalability.
 */
export function solveQuadraticWorkingSetStep(
  diagonal: readonly number[],
  linear: readonly number[],
  rows: readonly IAutoMovieQuadraticRow[],
  bounds: readonly number[],
  free: readonly boolean[],
  preceding: readonly number[],
): IAutoMovieQuadraticWorkingSetStep {
  const basis: IAutoMovieQuadraticConstraintBasis =
    createQuadraticConstraintBasis(
      rows,
      bounds,
      free,
      diagonal.length,
    );
  const result: IAutoMovieQuadraticWorkingSetStep = {
    primal: null,
    origin: null,
    flatDirection: null,
    normalDual: null,
    dual: null,
    basis,
    refusal: basis.refusal,
  };
  const fail: (reason: string) => IAutoMovieQuadraticWorkingSetStep = (
    reason: string,
  ): IAutoMovieQuadraticWorkingSetStep => {
    result.refusal = reason;
    return result;
  };
  if (basis.refusal !== null) return result;
  try {
    const dot: (a: readonly number[], b: readonly number[]) => number = (
      a: readonly number[],
      b: readonly number[],
    ): number => {
      let value: number = 0;
      for (let at: number = 0; at < a.length; at++) value += a[at]! * b[at]!;
      return value;
    };
    const projectDual: (values: readonly number[]) => number[] | null = (
      values: readonly number[],
    ): number[] | null => {
      try {
        const originalGradient: number[] = linear.map(
          (value: number, at: number): number =>
            value + diagonal[at]! * values[at]!,
        );
        // A_W' P D^-1 = Q R: R*c = -Q'g, y_W = P D^-1 c.
        // The unrepresented normal component remains for original KKT admission.
        const multipliers: number[] = basis.range.map(
          (column: number[]): number => -dot(column, originalGradient),
        );
        for (let row: number = basis.rank - 1; row >= 0; row--) {
          let value: number = multipliers[row]!;
          for (let column: number = row + 1; column < basis.rank; column++)
            value -= basis.triangular[row][column] * multipliers[column];
          multipliers[row] = value / basis.triangular[row][row];
        }
        const projected: number[] = new Array<number>(rows.length).fill(0);
        for (let at: number = 0; at < basis.rank; at++)
          projected[basis.order[at]] = multipliers[at] / basis.divisors[at];
        return projected;
      } catch (error: unknown) {
        if (error instanceof RangeError) return null;
        throw error;
      }
    };
    const origin: number[] = basis.particular.slice();
    const difference: number[] = preceding.map(
      (value: number, at: number): number => value - origin[at]!,
    );
    for (const column of basis.nullspace) {
      const coordinate: number = dot(column, difference);
      for (let at: number = 0; at < origin.length; at++)
        origin[at] += column[at]! * coordinate;
    }

    result.origin = origin;
    result.normalDual = projectDual(origin);
    const gradient: number[] = linear.map(
      (value: number, at: number): number =>
        value + diagonal[at]! * origin[at]!,
    );
    const indices: number[] = diagonal.map(
      (_: number, at: number): number => at,
    );
    const objectiveRows: IAutoMovieQuadraticRow[] = [],
      retained: number[] = [];
    const projectedFlatLinear: number[] = [];
    const objectiveTarget: number[] = diagonal.map(
      (value: number, at: number): number =>
        value === 0
          ? 0
          : Math.sqrt(value) * origin[at] + linear[at] / Math.sqrt(value),
    );
    const flatLinear: number[] = linear.map(
      (value: number, at: number): number => (diagonal[at] === 0 ? value : 0),
    );

    for (let at: number = 0; at < basis.nullspace.length; at++) {
      const column: number[] = basis.nullspace[at]!;
      const value: number = dot(column, gradient);

      const curved: boolean = column.some(
        (coefficient: number, i: number): boolean =>
          diagonal[i]! > 0 && coefficient !== 0,
      );
      if (!curved) {
        if (value !== 0) {
          result.flatDirection = column.map((coefficient: number): number =>
            value > 0 ? -coefficient : coefficient,
          );
          return result;
        }
        continue;
      }
      const weights: number[] = column.map(
        (coefficient: number, i: number): number =>
          Math.sqrt(diagonal[i]!) * coefficient,
      );
      if (
        weights.some(
          (coefficient: number, i: number): boolean =>
            coefficient === 0 && diagonal[i]! > 0 && column[i] !== 0,
        )
      )
        return fail("working-positive-curvature-underflow-or-overflow");
      objectiveRows.push({ indices, weights, lower: null, upper: null });
      retained.push(at);
      projectedFlatLinear.push(dot(column, flatLinear));
    }
    const curvature: IAutoMovieQuadraticConstraintBasis =
      createQuadraticConstraintBasis(
        objectiveRows,
        objectiveRows.map((): number => 0),
        objectiveRows.map((): boolean => false),
        diagonal.length,
      );
    if (curvature.refusal !== null)
      return fail("working-reduced-curvature: " + curvature.refusal);
    const count: number = curvature.rank,
      coordinates: number[] = new Array<number>(count).fill(0);
    // B P D^-1 = Q R. Curved terms use Q' times the original LS target,
    // avoiding a normal-equation RHS. Only genuine zero-H linear terms need
    // R' v = -D^-1 P' Z'q_flat. No objective term or curvature is invented.
    for (let row: number = 0; row < count; row++) {
      let value: number =
        -projectedFlatLinear[curvature.order[row]!]! / curvature.divisors[row]!;
      for (let column: number = 0; column < row; column++)
        value -= curvature.triangular[column]![row]! * coordinates[column]!;
      coordinates[row] = value / curvature.triangular[row][row];
    }
    for (let row: number = 0; row < count; row++)
      coordinates[row] -= dot(curvature.range[row]!, objectiveTarget);
    for (let row: number = count - 1; row >= 0; row--) {
      let value: number = coordinates[row]!;
      for (let column: number = row + 1; column < count; column++)
        value -= curvature.triangular[row]![column]! * coordinates[column]!;
      coordinates[row] = value / curvature.triangular[row][row];
    }
    const primal: number[] = origin.slice();
    for (let column: number = 0; column < count; column++) {
      const amount: number = coordinates[column]! / curvature.divisors[column]!;
      const vector: number[] =
        basis.nullspace[retained[curvature.order[column]!]!]!;
      for (let at: number = 0; at < primal.length; at++)
        primal[at] += amount * vector[at]!;
    }
    const dual: number[] | null = projectDual(primal);
    if (dual === null)
      return fail("working-objective-candidate-not-representable");
    result.primal = primal;
    result.dual = dual;
    return result;
  } catch (error: unknown) {
    return fail(
      "working-step-representation-refused: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}
