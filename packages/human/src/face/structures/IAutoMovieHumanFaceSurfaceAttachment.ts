/**
 * Sparse attachment of a face surface's vertices to one articulated owner.
 *
 * Rows are `[vertex, weight]` pairs, strictly increasing by vertex, with each
 * weight in (0, 1] and the weights of one vertex over all owners summing to at
 * most one; the remainder is the cranium, which the head frame holds still. A
 * vertex bound to one owner with weight one moves as that bone, and a blended
 * vertex takes the weighted mean of its owners' rigid images.
 * Structural admission permits a 1e-6 numerical excess in the summed weights
 * for source payload rounding; it does not renormalize those weights or prove
 * anatomical attachment. The intended whole-weight bound remains one.
 *
 * @evidence contracts/common.md#principled-implementation poseHumanFaceSurface adds each source owner's weighted rigid-image difference to the original point, leaving the head-frame complement stationary and avoiding linear interpolation of joint endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One owner and sorted sparse vertex/weight pairs keep source attachment separate from the owner's rotation/pivot/translation record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts assertHumanFaceArticulation requires declared unique owners, resident increasing vertices and finite (0,1] weights; its existing 1e-6 sum allowance is numerical, with no renormalization or anatomical validity inferred.
 * @evidence contracts/common.md#meaningful-documentation Sparse layout, stationary complement, full-owner movement and admitted sum-rounding limit identify the actual linear-blend contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This attachment record performs no admission scan or vertex transformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Owner motions are consumer-shared inputs; the schema implements no skinning cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source rows create no posed positions, recomputed normals or rig resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSurfaceAttachment {
  /** An owner `articulation` declares: `jaw`, or an eye's `id`. */
  owner: string;

  /** Flat `[vertex, weight]` pairs, strictly increasing by vertex. */
  rows: number[];
}
