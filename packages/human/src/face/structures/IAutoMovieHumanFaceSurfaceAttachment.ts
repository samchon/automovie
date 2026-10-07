/**
 * Sparse attachment of a face surface's vertices to one articulated owner.
 *
 * Rows are `[vertex, weight]` pairs, strictly increasing by vertex, with each
 * weight in (0, 1] and the weights of one vertex over all owners summing to at
 * most one; the remainder is the cranium, which the head frame holds still. A
 * vertex bound to one owner with weight one moves as that bone, and a blended
 * vertex takes the weighted mean of its owners' rigid images.
 *
 * @evidence contracts/common.md#principled-implementation Rigid images of the owners are blended by measured weights, which makes a tooth or globe rigid without a post-hoc fit.
 * @evidence contracts/common.md#clear-and-simple-design One named record pairs an owner with its sparse weight rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights are shared basis data measured from the source, never a person's sculpt.
 * @evidence contracts/common.md#meaningful-documentation States the row layout, ordering, weight domain and the cranium remainder.
 * @evidence contracts/modeling.md#part-identity-and-grouping The owner names an articulated part, the jaw or an eye, that the vertices move with.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Rows hold dimensionless indices and weights; the owners' transforms carry the frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels The attachment is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The attachment moves existing vertices and emits none.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The attachment builds no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The pose owner and face builder observe the posed form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Weights are measured from the source surface, not an anatomical constant.
 * @evidenceExclude contracts/anatomy.md#permitted-range The weight domain is arithmetic, not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSurfaceAttachment {
  /** An owner `articulation` declares: `jaw`, or an eye's `id`. */
  owner: string;

  /** Flat `[vertex, weight]` pairs, strictly increasing by vertex. */
  rows: number[];
}
