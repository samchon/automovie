/**
 * An orthogonal factorization of one working set of affine equations
 * `aᵢ · x = boundᵢ`, as `createAutoMovieQuadraticConstraintBasis` returns it.
 *
 * Each working row is normalized and the normals are factored by
 * column-pivoted Householder QR, `[a₁/d₁ … aₖ/dₖ] P = Q R`. Rows are
 * identified by their position in the working list the caller passed, not by
 * their row number in the whole program. Only exact structure removes a row:
 * a free equation fixing one variable to zero repeats an earlier one on the
 * same variable, or an all-zero row with a zero endpoint. Any other numerical
 * dependence sets `refusal` instead of dropping a row. All arrays are new and
 * owned by the caller; on a refusal they may be partial and must not be used.
 *
 * @evidence contracts/common.md#principled-implementation Records a rank-revealing QR of the normalized working normals, which yields orthonormal range and null-space bases and a minimum-norm particular solution without forming `A·Aᵀ`; the rank test is a dimension-scaled binary64 threshold, and an ambiguous rank is refused rather than guessed.
 * @evidence contracts/common.md#clear-and-simple-design Holds exactly what the working-set step reads: the pivot order and divisors to map multipliers back to rows, `R` to solve with, the two bases and the particular point, plus the rank reading and merged rows for diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only exact zero-singleton repeats and tautological zero rows are merged; every other dependence is reported through `refusal`, and no row or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the equations and factorization, how rows are identified, which rows may be merged, what a refusal means for the other fields, and ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record with no algorithm; the factorization cost is answered on `createAutoMovieQuadraticConstraintBasis`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A per-call result for one working set; the polishing loop builds a new one whenever the set changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Dense arrays owned by the caller, `variables²` numbers for the two bases plus `rank²` for `R`; nothing else is retained.
 */
export interface IAutoMovieQuadraticConstraintBasis {
  /** Number of variables in the program; the length of every basis column. */
  variables: number;

  /** Number of independent working equations factored, the size of `R`. */
  rank: number;

  /** Why the working set could not be factored reliably, or `null`. */
  refusal: string | null;

  /**
   * Pivot magnitude every factored column had to exceed:
   * `max(variables, rows) · ε · largest normalized column norm`. A rank
   * reading, not a geometric tolerance.
   */
  rankThreshold: number;

  /** Working-list positions of the factored rows, in pivot order. */
  order: number[];

  /**
   * Divisor each factored row was normalized by, paired with `order`: the
   * Euclidean norm of its weights, or the raw signed weight for a free
   * equation fixing one variable to zero.
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
   * Groups of working-list positions of free equations fixing the same
   * variable to zero; the first of each group is the one factored.
   */
  equivalentFreeRows: number[][];
}
