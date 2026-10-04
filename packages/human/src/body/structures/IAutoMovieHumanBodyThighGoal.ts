/**
 * One explicit thigh orientation in its basis's named source-reference frame.
 *
 * The reference's rest-to-current rotation carries the thigh's shaped rest
 * frame; flexion, abduction and twist then use that thigh's existing axes,
 * signs and neutral degrees. These are source-rig articulation coordinates,
 * not a registered individual's anatomical hip angles or measured capacity.
 * The basis supplies the exact reference identity and authoring envelope.
 *
 * An explicit zero goal keeps that reference-relative rest relationship.
 * Omitting the goal retains the legacy source-joint pose instead, so a zero
 * goal is never removed as if it were an omitted pose entry. All three angles
 * are finite; the shared document/basis admission owns validity and ranges.
 *
 * @evidence contracts/common.md#principled-implementation One named thigh and three existing source degree channels define the requested orientation; the basis owns reference, axes, signs, neutral and ranges.
 * @evidence contracts/common.md#clear-and-simple-design The optional document row carries no frame vectors, geometry, second pose or mutable runtime state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No photo, clinical registration or stored vertex payload stands in for a source-reference orientation.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes explicit zero from omission and source-rig motion from individual clinical capacity.
 * @evidence contracts/modeling.md#parameter-channels Flexion, abduction and twist retain the moving thigh's source axes, signs and neutral degree conventions.
 * @evidence contracts/modeling.md#spatial-conventions The named reference's rigid rest-to-current travel transports the thigh's shaped rest frame before its source articulation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines an authored motion, not a generated part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Stores no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder and editor own the goal's performed surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical value or clinical frame.
 * @evidence contracts/anatomy.md#permitted-range Shared runtime admission preserves the declared source envelope and the converted source-joint and actual parent-relative range checks.
 * @evidence contracts/anatomy.md#parametric-authority The caller requests named motion degrees rather than vertices, axes or arbitrary meshes.
 */
export interface IAutoMovieHumanBodyThighGoal {
  /** The source thigh whose orientation is requested. */
  bone: "leftUpperLeg" | "rightUpperLeg";
  /** Source flexion degrees in the reference-transported thigh rest frame. */
  flexion: number;
  /** Source abduction degrees with this side's declared sign and neutral. */
  abduction: number;
  /** Source axial degrees with this side's declared sign and neutral. */
  twist: number;
}
