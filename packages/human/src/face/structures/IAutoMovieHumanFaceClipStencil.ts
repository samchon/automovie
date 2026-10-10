/**
 * Frozen source-edge preimage of one vertex of a clipped face basis surface.
 *
 * A retained source vertex has a=b and t=0; an edge vertex created by the cut
 * is (1-t)*a+t*b over the undirected source edge with a<b. The same affine
 * stencil evaluates positions, endpoint rows and attachment weights, so a
 * complementary source compiler consumes these identities rather than
 * fitting positions to a new edge.
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
