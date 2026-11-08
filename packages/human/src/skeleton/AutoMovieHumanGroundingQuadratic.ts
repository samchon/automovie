import {
  type IAutoMovieQuadraticRow,
  refineAutoMovieQuadraticProgram,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";

import type { AutoMovieHumanGrounding } from "./AutoMovieHumanGrounding";

/** Local QP assembly/certificate and active-bound linear reductions, with no FK or retained solver. */
export namespace AutoMovieHumanGroundingQuadratic {
  /** One original full-foot height or clinical interval: row dot step >= bound. */
  export interface ILinearFloor {
    /** Original ordered local coefficients. */
    row: number[];

    /** Original lower bound in the row's declared units. */
    bound: number;
  }

  /** One proposed direction and its independent local numerical certificate. */
  export interface IQuadraticStep {
    /** Proposed local coordinate direction before the existing common fraction. */
    delta: number[];

    /** Original QP status and independent KKT readings. */
    observation: AutoMovieHumanGrounding.IQuadratic;
  }

  /**
   * Express the coupled least-squares quadratic through the existing public
   * Engine diagonal-PSD API. Auxiliary residual coordinates satisfy r=J*step;
   * their unit diagonal and base-residual linear term give exactly J'J and J'e,
   * while the original angular/root damping remains on the step coordinates.
   * Every original full-foot inequality and clinical interval is retained.
   * One cold engine-owned TypeScript solve and at most8N existing polishing steps
   * add no FK or outer update. Original-coordinate KKT1e-12 remains a numerical
   * certificate; it is not necessary for an inexact local descent direction.
   * A finite QP Solved proposal still passes the unchanged actual nonlinear
   * merit, complete floor and clinical checks. Incomplete numerical status supplies
   * no direction. Exact nonlinear full-cloud trials remain the admission authority. Auxiliary rows require
   * O(NF+NT) storage for F source vertices and T target coordinates; each numerical
   * call owns its sparse factors and iterate. The workspace owner releases its
   * TypeScript buffer references in finally, with no retained solver or reactor.
   */
  export function floorDelta(
    derivatives: number[][],
    base: number[],
    damping: number[],
    preference: number[],
    values: readonly number[],
    bounds: readonly { minimum: number; maximum: number }[],
    floors: ILinearFloor[],
  ): IQuadraticStep {
    const n: number = derivatives.length;
    const rows: IAutoMovieQuadraticRow[] = floors.map(
      (floor: ILinearFloor): IAutoMovieQuadraticRow => ({
        indices: floor.row.map((_: number, index: number): number => index),
        weights: floor.row,
        lower: floor.bound,
        upper: null,
      }),
    );
    for (let index: number = 0; index < values.length; index++)
      rows.push({
        indices: [index],
        weights: [1],
        lower: bounds[index]!.minimum - values[index]!,
        upper: bounds[index]!.maximum - values[index]!,
      });
    for (let index: number = 0; index < base.length; index++)
      rows.push({
        indices: [
          ...derivatives.map((_: number[], column: number): number => column),
          n + index,
        ],
        weights: [
          ...derivatives.map((column: number[]): number => column[index]!),
          -1,
        ],
        lower: 0,
        upper: 0,
      });
    const problem: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
      diagonal: [...damping, ...base.map((): number => 1)],
      linear: [...preference.map((value: number): number => -value), ...base],
      rows,
    };
    const native: ReturnType<typeof solveAutoMovieQuadraticProgram> =
      solveAutoMovieQuadraticProgram(problem);
    const result:
      | ReturnType<typeof refineAutoMovieQuadraticProgram>
      | undefined =
      native.status === 1
        ? refineAutoMovieQuadraticProgram(problem, native, {
            tolerance: 1e-12,
            maximumRefinements: 8 * n,
          })
        : undefined;
    const certified: boolean =
      !!result &&
      result.maximumViolation <= 1e-12 &&
      result.stationarityResidual <= 1e-12 &&
      result.complementarityResidual <= 1e-12;
    const proposed: number[] = (
      certified ? result!.primal : native.primal
    ).slice(0, n);
    const usable: boolean =
      native.status === 1 &&
      proposed.length === n &&
      proposed.every(Number.isFinite);
    return {
      delta: usable ? proposed : derivatives.map((): number => 0),
      observation: {
        nativeStatus: native.status,
        nativeIterations: native.iterations,
        maximumViolation: result?.maximumViolation ?? native.maximumViolation,
        stationarityResidual:
          result?.stationarityResidual ?? native.stationarityResidual,
        ...(result
          ? { complementarityResidual: result.complementarityResidual }
          : {}),
        certified,
        refinements: result?.refinements ?? 0,
        direction: usable ? (certified ? "certified" : "inexact") : "none",
      },
    };
  }

  /**
   * Solve the same damped system on its feasible active-bound face. At most N
   * algebraic reductions fix outward angular coordinates; no extra FK or update
   * is acquired. Root translation columns have no angular interval. The caller
   * then limits every remaining component with one common fraction, preserving
   * the coupled direction rather than separately clipping its coordinates.
   */
  export function boundedDelta(
    matrix: number[][],
    right: number[],
    values: readonly number[],
    bounds: readonly { minimum: number; maximum: number }[],
  ): number[] {
    const fixed: Set<number> = new Set();
    let delta: number[] = linear(matrix, right);
    for (let pass: number = 0; pass < values.length; pass++) {
      const blocked: number[] = values.flatMap(
        (value: number, index: number): number[] =>
          !fixed.has(index) &&
          ((value <= bounds[index]!.minimum + 1e-10 && delta[index]! < 0) ||
            (value >= bounds[index]!.maximum - 1e-10 && delta[index]! > 0))
            ? [index]
            : [],
      );
      if (!blocked.length) break;
      for (const index of blocked) fixed.add(index);
      const reduced: number[][] = matrix.map(
        (row: number[], i: number): number[] =>
          row.map((value: number, j: number): number =>
            fixed.has(i) || fixed.has(j) ? (i === j ? 1 : 0) : value,
          ),
      );
      delta = linear(
        reduced,
        right.map((value: number, index: number): number =>
          fixed.has(index) ? 0 : value,
        ),
      );
    }
    return delta;
  }
}

/** Pivoted elimination of a damped small clinical/root normal system. */
function linear(matrix: number[][], right: number[]): number[] {
  const n: number = right.length;
  const rows: number[][] = matrix.map((row: number[], i: number): number[] => [
    ...row,
    right[i]!,
  ]);
  for (let column: number = 0; column < n; ++column) {
    let pivot: number = column;
    for (let row: number = column + 1; row < n; ++row)
      if (Math.abs(rows[row]![column]!) > Math.abs(rows[pivot]![column]!))
        pivot = row;
    [rows[column], rows[pivot]] = [rows[pivot]!, rows[column]!];
    const divisor: number = rows[column]![column]!;
    if (Math.abs(divisor) < 1e-18) return right.map((): number => 0);
    for (let k: number = column; k <= n; ++k)
      rows[column]![k] = rows[column]![k]! / divisor;
    for (let row: number = 0; row < n; ++row) {
      if (row === column) continue;
      const factor: number = rows[row]![column]!;
      for (let k: number = column; k <= n; ++k)
        rows[row]![k] = rows[row]![k]! - factor * rows[column]![k]!;
    }
  }
  return rows.map((row: number[]): number => row[n]!);
}
