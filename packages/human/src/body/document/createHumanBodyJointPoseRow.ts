import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

/**
 * One joint row of a body document's pose from the clinical angles that are set.
 *
 * Angles are clinical degrees; an omitted angle is `null`, which the pose type
 * defines as unchanged, so a row states only what it moves. Editor presets and
 * review states build their rows through this one owner; document admission
 * and the builder still judge every angle against the basis ranges.
 *
 * @evidence contracts/common.md#principled-implementation A sparse row carries only the axes it moves, matching the pose type's null-means-unchanged semantics.
 * @evidence contracts/common.md#clear-and-simple-design One pure constructor shared by every preset and review state instead of a copy per consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor admits nothing and clamps nothing; admission and the builder own range judgement.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the null convention and where range judgement happens.
 * @evidence contracts/modeling.md#parameter-channels Writes the named clinical flexion, abduction and twist channels of one joint.
 * @evidence contracts/modeling.md#spatial-conventions Angles are clinical degrees in the joint's anatomical frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The row names an existing rig bone and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The row emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The row builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder and editor observe the posed body.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The row carries caller angles, not an anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range Document admission and the pose validator judge the range.
 * @evidence contracts/anatomy.md#parametric-authority The row is expressed in named clinical joint angles, never vertices or curves.
 * @author Samchon
 */
export function createHumanBodyJointPoseRow(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null = null,
  twist: number | null = null,
): IAutoMovieJointPose {
  return { bone, flexion, abduction, twist };
}
