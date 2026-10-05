/**
 * A named point of a body basis's skin: one vertex of one surface.
 *
 * Measurement rules and the underwear refer to skin points by name, never by
 * vertex number, because vertex numbers belong to one basis's topology: the
 * same index names a different place on another basis. Each basis states
 * where its own named points are. A rule naming a point the basis does not
 * declare refuses by that name.
 *
 * @evidence contracts/common.md#principled-implementation The basis owns the index of its own points, so a rule carries no topology of a particular basis.
 * @evidence contracts/common.md#clear-and-simple-design Two indices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing name refuses; no nearest vertex or other basis's index stands in.
 * @evidence contracts/common.md#meaningful-documentation States why points are named and what a missing name does.
 * @evidence contracts/modeling.md#spatial-conventions The point is a vertex of a basis surface; its position is that surface's, in the basis frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The point names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The point carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The point emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The point builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The point is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each consumer rule cites the anatomical definition of the point it names.
 * @evidenceExclude contracts/anatomy.md#permitted-range The point admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The point is no input a document sets.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmark {
  /** Index into the basis's surfaces. */
  surface: number;

  /** Index of the vertex in that surface. */
  vertex: number;
}
