import type { IAutoMovieJointPose, IAutoMovieKeyframe, IAutoMovieMotion, IAutoMovieVector3 } from "@automovie/interface";
import { rootShiftClip } from "./rootShiftClip";

/** Add copies of the original authored joint records to every existing root-shift frame, so contact correction must replace only its own chain. */
export const posedRootShiftClip: (skeleton: string, shift: IAutoMovieVector3, joints: readonly IAutoMovieJointPose[]) => IAutoMovieMotion = (
  skeleton: string,
  shift: IAutoMovieVector3,
  joints: readonly IAutoMovieJointPose[],
): IAutoMovieMotion => {
  const base: IAutoMovieMotion = rootShiftClip(skeleton, shift);
  return {
    ...base,
    keyframes: base.keyframes.map((kf: IAutoMovieKeyframe): IAutoMovieKeyframe => ({
      ...kf,
      pose: { ...kf.pose, joints: joints.map((j: IAutoMovieJointPose): IAutoMovieJointPose => ({ ...j })) },
    })),
  };
};
