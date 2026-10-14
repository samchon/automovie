import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Apply a scalar envelope to reachPose's numeric clinical arm axes. Zero weight returns an empty articulation; root remains null. This internal helper assumes all supplied reach joints have numeric axes.
 *
 * @evidence contracts/common.md#principled-implementation Multiplies each of the analytic reach joints' three axes by the caller's envelope weight, without introducing null-axis blending or changing the solved bone set.
 * @evidence contracts/common.md#clear-and-simple-design A shared arm envelope primitive keeps dynamic point/reach and jab poses consistent while their timing laws remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numeric-axis premise is supplied by reachPose, and interpolation toward zero is the existing empty-rest choreography rather than a general clinical neutral-pose solver.
 * @evidence contracts/common.md#meaningful-documentation States numeric clinical arm axes, zero-weight empty articulation, null root and fresh weighted joint ownership.
 * @evidence contracts/performance.md#efficient-algorithms For J supplied reach joints, O(J) arithmetic and fresh joint entries; current callers provide the two-bone arm solve.
 * @evidence contracts/performance.md#reuse-equivalent-work Each sampled IK result is weighted once; poses with different targets or times are not shared through a cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh pose and joint entries; input joints are read only and no retained map, task or external resource exists.
 */
export const actorWeightedArmPose: (
  skeleton: string,
  pose: IAutoMoviePose,
  weight: number,
) => IAutoMoviePose = (
  skeleton: string,
  pose: IAutoMoviePose,
  weight: number,
): IAutoMoviePose => ({
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
});
