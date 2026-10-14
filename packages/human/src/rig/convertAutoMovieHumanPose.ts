import { IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";

import { IAutoMovieHumanPose } from "../structures/IAutoMovieHumanPose";

/**
 * Convert a Human pose into the engine pose films play.
 *
 * Both documents name clinical flexion, abduction and twist in degrees from the rest pose about the same axes, so each joint maps one to one in the same order; a zero angle stays zero rather than becoming null, which the engine treats alike. The root stays where the scene places it. The function does not admit the pose.
 *
 * @param pose Human pose
 * @param skeleton Id of the person's emitted skeleton
 * @returns Engine pose on that skeleton
 */
export function convertAutoMovieHumanPose(
  pose: IAutoMovieHumanPose,
  skeleton: string,
): IAutoMoviePose {
  return {
    skeleton,
    root: null,
    joints: pose.joints.map(
      (joint: IAutoMovieHumanPose.IJoint): IAutoMovieJointPose => ({
        bone: joint.bone,
        flexion: joint.flexion,
        abduction: joint.abduction,
        twist: joint.twist,
      }),
    ),
  };
}
