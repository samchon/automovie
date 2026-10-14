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
 * @evidence contracts/common.md#principled-implementation Three finite angles apply in a named source-reference frame transported from rest, using the basis's axes, signs and neutral.
 * @evidence contracts/common.md#clear-and-simple-design An explicit side choice and three coordinates define one thigh orientation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These source-rig coordinates do not certify anatomical hip capacity; an explicit zero is distinct from omission.
 * @evidence contracts/common.md#meaningful-documentation The prose describes degree units, reference transport, zero semantics and admission ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The source-reference thigh goals definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source-reference thigh goals type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source-reference thigh goals declaration does not acquire or retain runtime resources.
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
