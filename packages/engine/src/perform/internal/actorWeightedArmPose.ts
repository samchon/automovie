import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

/*
 * Apply a scalar envelope to reachPose's numeric clinical arm axes. Zero weight
 * returns an empty articulation; root remains null. This internal helper
 * assumes all supplied reach joints have numeric axes.
 */
export function actorWeightedArmPose(
  skeleton: string,
  pose: IAutoMoviePose,
  weight: number,
): IAutoMoviePose {
  return {
    skeleton,
    root: null,
    joints:
      weight === 0
        ? []
        : pose.joints.map(
            (
              joint: IAutoMovieJointPose,
            ): {
              bone: AutoMovieHumanoidBone;
              flexion: number;
              abduction: number;
              twist: number;
            } => ({
              bone: joint.bone,

              flexion: joint.flexion! * weight,
              abduction: joint.abduction! * weight,
              twist: joint.twist! * weight,
            }),
          ),
  };
}
