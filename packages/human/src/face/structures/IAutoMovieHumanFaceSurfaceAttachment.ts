/**
 * Sparse attachment of a face surface's vertices to one articulated owner.
 *
 * Rows are `[vertex, weight]` pairs, strictly increasing by vertex, with each
 * weight in (0, 1] and the weights of one vertex over all owners summing to at
 * most one; the remainder is the cranium, which the head frame holds still. A
 * vertex bound to one owner with weight one moves as that bone, and a blended
 * vertex takes the weighted mean of its owners' rigid images.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSurfaceAttachment {
  /** An owner `articulation` declares: `jaw`, or an eye's `id`. */
  owner: string;

  /** Flat `[vertex, weight]` pairs, strictly increasing by vertex. */
  rows: number[];
}
