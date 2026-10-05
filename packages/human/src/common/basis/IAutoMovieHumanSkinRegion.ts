/**
 * A named area of a basis's skin, face or body: a set of vertices of one
 * surface.
 *
 * Measurement rules refer to a skin area by name, never by a vertex list,
 * because vertex numbers belong to one basis's topology. A rule that must keep
 * a feature out of a search (the person head breadth keeps `ear-right` and
 * `ear-left` out of its euryon search, `readHumanHeadBreadth`) names the
 * area; the basis states which of its vertices it holds. A
 * rule naming an area the basis does not declare refuses by that name.
 *
 * @evidence contracts/common.md#principled-implementation The basis owns the vertex set of its own areas, so a rule carries no topology of a particular basis.
 * @evidence contracts/common.md#clear-and-simple-design One surface index and one sorted vertex list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing name refuses; no geometric guess or other basis's list stands in.
 * @evidence contracts/common.md#meaningful-documentation States why areas are named, the list order and what a missing name does.
 * @evidence contracts/modeling.md#spatial-conventions The vertices index a basis surface; their positions are that surface's, in the basis frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The area names skin vertices, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The area carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The area emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The area builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The area is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The producer records how each area was defined; each consumer rule cites the anatomical definition it serves.
 * @evidenceExclude contracts/anatomy.md#permitted-range The area admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The area is no input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinRegion {
  /** Index into the basis's surfaces. */
  surface: number;

  /** Vertex indices in that surface, strictly increasing. */
  vertices: number[];
}
