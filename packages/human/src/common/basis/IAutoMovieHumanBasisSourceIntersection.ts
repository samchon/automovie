/**
 * One frozen original-edge preimage in a shared source cut table.
 * Its virtual sample is (1-t)*a+t*b over two distinct original source IDs.
 * The enclosing table's order assigns the virtual sample ID; both partitions
 * reuse the same ordered endpoints and t without reordering or renormalizing.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisSourceIntersection {
  /** Original source vertex ID at t=0, in [0, originalVertices). */
  readonly a: number;

  /** Distinct original source vertex ID at t=1, in [0, originalVertices). */
  readonly b: number;

  /** Dimensionless affine parameter along a to b, with 0 < t < 1. */
  readonly t: number;
}
