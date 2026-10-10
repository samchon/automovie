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
