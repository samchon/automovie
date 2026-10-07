import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

/**
 * One joint row of a review document from the angles that are set.
 *
 * An angle left out is `null`, which the pose type defines as unchanged, so a
 * row states only what a review state moves. `bone` is a basis joint id, typed
 * as a string on the basis, and is narrowed to the humanoid bone name here in
 * the one place review states are built; the builder and the editor refuse a
 * row whose bone the rig does not have, so a wrong name fails when the
 * document is applied and never draws a wrong frame. Pure.
 */
export function createJointPoseRow(
  bone: string,
  angles: {
    flexion?: number | null;
    abduction?: number | null;
    twist?: number | null;
  },
): IAutoMovieJointPose {
  return {
    bone: bone as AutoMovieHumanoidBone,
    flexion: angles.flexion ?? null,
    abduction: angles.abduction ?? null,
    twist: angles.twist ?? null,
  };
}
