/**
 * The two performed halves of a person's skin in the common body frame: face and body flat positions plus the body triangle indices. Registered generation evaluation keeps the original body partition topology; legacy evaluation supplies its cut-body population and retained triangles. Positions are metres, Y up, +Z forward, and must match the normal compiler's captured populations.
 *
 * @evidence contracts/common.md#principled-implementation Face and body positions share one body frame, while body indices identify the original partition or retained cut triangles that must match captured source-cell topology.
 * @evidence contracts/common.md#clear-and-simple-design Only current coordinates and retained body topology cross the per-evaluation seam; generation metadata stays compiled separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fields carry actual performed geometry instead of neutral coordinates substituted for missing posed cells.
 * @evidence contracts/common.md#meaningful-documentation Comments state flat metre coordinates, Y-up/Z-forward frame, original-partition versus legacy-cut populations and captured-topology agreement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The current face/body coordinate arrays are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the current face/body coordinate arrays; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring current face/body coordinate arrays acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonPerformedSkin {
  /** Face skin flat positions, metres. */
  face: readonly number[];

  /** Body skin flat positions, metres, in the captured original-partition or legacy-cut population. */
  body: readonly number[];

  /** Body triangle vertex index triples matching the normal compiler's captured topology. */
  bodyIndices: readonly number[];
}
