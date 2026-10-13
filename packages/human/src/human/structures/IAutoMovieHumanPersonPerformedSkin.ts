/**
 * The two performed halves of a person's skin in the common body frame: the face skin's flat positions, the body skin's flat positions after the cut, and the body triangle indices retained by that cut. Positions are metres, Y up, +Z forward.
 *
 * @evidence contracts/common.md#principled-implementation Face and retained cut-body positions share one body frame, while body indices identify exactly which performed triangles participate in source-cell admission.
 * @evidence contracts/common.md#clear-and-simple-design Only current coordinates and retained body topology cross the per-evaluation seam; generation metadata stays compiled separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fields carry actual performed geometry instead of neutral coordinates substituted for missing posed cells.
 * @evidence contracts/common.md#meaningful-documentation Comments state flat metre coordinates, Y-up/Z-forward frame and the retained body triangle-index triples.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The current face and cut-body coordinate arrays are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the current face and cut-body coordinate arrays; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring current face and cut-body coordinate arrays acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonPerformedSkin {
  /** Face skin flat positions, metres. */
  face: readonly number[];

  /** Cut body skin flat positions, metres. */
  body: readonly number[];

  /** Body triangle vertex index triples retained by the cut. */
  bodyIndices: readonly number[];
}
