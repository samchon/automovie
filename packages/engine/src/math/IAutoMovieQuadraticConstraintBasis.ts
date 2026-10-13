/**
 * Owned orthogonal coordinates for one independent working constraint basis.
 * Exact singleton zero equalities retain their original equivalent ordinals;
 * unresolved numerical dependence refuses instead of dropping a condition.
 * Original complete-row admission remains the refinement caller's authority.
 *
 * @author Samchon
 */
export interface IAutoMovieQuadraticConstraintBasis {
  /** Original primal variable count. */
  variables: number;

  /** Independent working normal count; not a complete problem row count. */
  rank: number;

  /** Named inability to represent a trustworthy basis, or null. */
  refusal: string | null;

  /** Dimension-scaled binary64 rank reading, not a geometric tolerance. */
  rankThreshold: number;

  /** Independent working input ordinals, in orthogonal-factor order. */
  order: number[];

  /** Original equation divisors paired with order; a free singleton may be signed. */
  divisors: number[];

  /** Upper triangular factor of the normalized working transpose. */
  triangular: number[][];

  /** Orthonormal range columns in original primal coordinates. */
  range: number[][];

  /** Orthonormal null-space columns in original primal coordinates. */
  nullspace: number[][];

  /** Particular solution of the working affine endpoints. */
  particular: number[];

  /** Exact free zero-singleton equivalent working ordinals, before numerical factorization. */
  equivalentFreeRows: number[][];
}
