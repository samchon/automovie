/**
 * An orthogonal factorization of one working set of affine equations `aᵢ · x =
 * boundᵢ`, as `createAutoMovieQuadraticConstraintBasis` returns it.
 *
 * Each working row is normalized and the normals are factored by column-pivoted
 * Householder QR, `[a₁/d₁ … aₖ/dₖ] P = Q R`. Rows are identified by their
 * position in the working list the caller passed, not by their row number in
 * the whole program. Only exact structure removes a row: a free equation fixing
 * one variable to zero repeats an earlier one on the same variable, or an
 * all-zero row with a zero endpoint. Any other numerical dependence sets
 * `refusal` instead of dropping a row. All arrays are new and owned by the
 * caller; on a refusal they may be partial and must not be used.
 */
export interface IAutoMovieQuadraticConstraintBasis {
  /** Number of variables in the program; the length of every basis column. */
  variables: number;

  /** Number of independent working equations factored, the size of `R`. */
  rank: number;

  /** Why the working set could not be factored reliably, or `null`. */
  refusal: string | null;

  /**
   * Pivot magnitude every factored column had to exceed: `max(variables, rows)
   * · ε · largest normalized column norm`. A rank reading, not a geometric
   * tolerance.
   */
  rankThreshold: number;

  /** Working-list positions of the factored rows, in pivot order. */
  order: number[];

  /**
   * Divisor each factored row was normalized by, paired with `order`: the
   * Euclidean norm of its weights, or the raw signed weight for a free equation
   * fixing one variable to zero.
   */
  divisors: number[];

  /** Upper-triangular `R`, `rank` by `rank`, of the pivoted QR. */
  triangular: number[][];

  /** `rank` orthonormal columns spanning the working normals. */
  range: number[][];

  /** `variables − rank` orthonormal columns spanning their null space. */
  nullspace: number[][];

  /** Minimum-norm point satisfying every factored working equation. */
  particular: number[];

  /**
   * Groups of working-list positions of free equations fixing the same variable
   * to zero; the first of each group is the one factored.
   */
  equivalentFreeRows: number[][];
}
