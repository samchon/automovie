/**
 * Frozen source-edge preimage of one vertex of a clipped face basis surface.
 *
 * A retained source vertex has a=b and t=0; an edge vertex created by the cut
 * is (1-t)*a+t*b over the undirected source edge with a<b. The same affine
 * stencil evaluates positions, endpoint rows and attachment weights, so a
 * complementary source compiler consumes these identities rather than
 * fitting positions to a new edge.
 *
 * @evidence contracts/common.md#principled-implementation Canonically ordered source edge ends and one frozen dimensionless fraction preserve the same affine preimage for cropped positions, sparse endpoints and attachment weights.
 * @evidence contracts/common.md#clear-and-simple-design A retained-vertex or edge-preimage triple is independent of material seams and output geometry, whose owner supplies its ordinal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source identities are not fitted from resulting coordinates, and the stencil creates no personal geometry target or permission to retain stale post-crop metadata.
 * @evidence contracts/common.md#meaningful-documentation The comment gives retained-vertex and edge formulas, ordering and consumers; members identify each endpoint and zero retained fraction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record evaluates no interpolation or intersection search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Frozen identity supplies shared replay inputs; the crop/compiler owns actual repeated evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The crop result owns scalar stencil records; no source mesh or handle is acquired here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceClipStencil {
  /** First source vertex: the retained vertex itself, or the smaller edge end. */
  a: number;

  /** Second source vertex: equal to a for a retained vertex, else the larger edge end. */
  b: number;

  /** Dimensionless edge parameter, zero for a retained vertex. */
  t: number;
}
