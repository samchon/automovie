/**
 * Frozen source-edge preimage of one vertex of a clipped face basis surface.
 *
 * A retained source vertex has a=b and t=0; an edge vertex created by the cut
 * is (1-t)*a+t*b over the undirected source edge with a<b. The same affine
 * stencil evaluates positions, endpoint rows and attachment weights, so a
 * complementary source compiler consumes these identities rather than
 * fitting positions to a new edge.
 *
 * @evidence contracts/common.md#principled-implementation Every clipped vertex keeps an affine preimage on the original surface, so all vertex-affine data is evaluated by the same frozen stencil.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the clip owner's anonymous stencil type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The stencil records source identities and an edge parameter, never fitted coordinates.
 * @evidence contracts/common.md#meaningful-documentation States the resident and edge encodings, the endpoint order and who consumes the identities.
 * @evidence contracts/modeling.md#spatial-conventions Endpoint IDs are dimensionless source vertex indices and t is a dimensionless edge parameter; no frame is stored.
 * @evidence contracts/modeling.md#shared-boundaries Both sides of a shared clipped edge reuse the one preimage owned by that undirected edge.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A stencil defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A stencil is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The clip owner emits geometry; the stencil records provenance.
 * @evidenceExclude contracts/modeling.md#rendered-observation The crop producer and consuming assembly observe the clipped surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source An edge parameter is no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The t domain is a chart domain, not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline correspondence is not a person-authoring input.
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
