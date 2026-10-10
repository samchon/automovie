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
 * @author Samchon
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
