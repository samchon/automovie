/**
 * One frozen original-edge preimage in a shared source cut table.
 * Its virtual sample is (1-t)*a+t*b over two distinct original source IDs.
 * The enclosing table's order assigns the virtual sample ID; both partitions
 * reuse the same ordered endpoints and t without reordering or renormalizing.
 *
 * @evidence contracts/common.md#principled-implementation Distinct original endpoint ids and an open-unit affine parameter define one frozen edge preimage.
 * @evidence contracts/common.md#clear-and-simple-design The enclosing ordered table owns virtual identity so both partitions reuse the same stencil.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint order and parameter remain unchanged rather than being renormalized per consumer.
 * @evidence contracts/common.md#meaningful-documentation Members state original-id bounds, ordered endpoint roles and the strict parameter interval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The frozen source edge intersection has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The frozen source edge intersection schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The frozen source edge intersection declaration allocates no runtime state or handles.
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
