/**
 * One connected exterior body skin generated from internal anatomy and pose.
 *
 * Positions and oriented triangles are outputs only, never document controls or stored templates. Body skin may remain open at the existing neck/collar interface while the face is owned elsewhere. A generator must validate connectedness, orientation, nonintersection, the collar correspondence and support against resolved internal tissues before render/export.
 *
 * @evidence contracts/common.md#principled-implementation Output-only metre positions, oriented triangles and ordered collar ordinals describe one connected exterior with an explicitly open shared neck seam.
 * @evidence contracts/common.md#clear-and-simple-design Exterior geometry/collar correspondence stay separate from internal volumetric part outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arrays are neither document controls nor stored templates; validation must establish connectivity, orientation, intersection and tissue support.
 * @evidence contracts/common.md#meaningful-documentation Members give common frame, oriented indices and ordered shared collar ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generated-skin schema chooses no surface tessellation or validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Collar correspondence records output identity without caching shape evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Output arrays belong to their generator; this type creates no GPU residency.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGeneratedSkin {
  /** Flat XYZ metres in the common Y-up, Z-forward body frame. */
  readonly positionsMetres: readonly number[];

  /** Oriented triangle vertex ordinals of the single exterior component. */
  readonly triangles: readonly number[];

  /** Ordered vertex ordinals along the existing neck/collar seam. */
  readonly collarBoundary: readonly number[];
}
