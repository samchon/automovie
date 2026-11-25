import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { ExerciseKey } from "./ExerciseKey";

/** The record of `IPrepareWorkoutKeyFramesResult2`'s site. */
type IPrepareWorkoutKeyFramesResult2 = {
  posture: IAutoMovieMotionHumanPosture;
  bones: ReturnType<typeof poseBones>;
};

/** The record of `IPrepareWorkoutKeyFramesResult`'s site. */
type IPrepareWorkoutKeyFramesResult = {
  posture: IAutoMovieMotionHumanPosture;
  bones: ReturnType<typeof poseBones>;
};

/**
 * Own actual key-to-frame observations within one synchronous workout geometry
 * search. A key's posed representation has no limb/digit/rotation goals, but
 * arbitrary key producers may change clinical joints at every trial, so every
 * actual key retains ordinary complete canonical admission.
 *
 * @param body The unchanged canonical body of this pitch or roll search.
 * @param requested Fixed output bone demand; omission preserves the complete
 *   map.
 * @returns A current authored-key reader yielding a fresh raw view with
 *   borrowed key joint tuples and a fresh actual bone map; release the reader
 *   when this search returns or throws.
 */
export function prepareWorkoutKeyFrames(
  body: IAutoMovieMotionHumanBody,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): (
  key: IAutoMovieMotionHumanExerciseKey.IKey,
) => IPrepareWorkoutKeyFramesResult {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const frames: ReturnType<typeof poseBones.prepare> | undefined =
    requested === undefined ? undefined : poseBones.prepare(body, requested);
  return (
    key: IAutoMovieMotionHumanExerciseKey.IKey,
  ): IPrepareWorkoutKeyFramesResult2 => {
    const posture: IAutoMovieMotionHumanPosture = ExerciseKey.posed(key, 0);
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    return {
      posture,
      bones:
        frames === undefined
          ? poseBones(body, pose, resolution())
          : frames(pose, resolution()),
    };
  };
}
