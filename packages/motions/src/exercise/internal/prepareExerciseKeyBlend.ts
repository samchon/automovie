import type {
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";

/*
 * Prepare the blend of two fixed exercise keys: linear in joint space, the
 * joints through the one joint-map blend owner (`prepareHumanShapeBlend`, a
 * joint one key leaves out read as zero there) and the tilt, the turn and the
 * lift scalar by scalar.
 * Parameter a: The fixed key at share zero.
 * Parameter b: The fixed key at share one.
 * Returns: The key a share of the way from `a` to `b`, the share in [0, 1].
 */
export function prepareExerciseKeyBlend(
  a: IAutoMovieMotionHumanExerciseKey.IKey,
  b: IAutoMovieMotionHumanExerciseKey.IKey,
): (share: number) => IAutoMovieMotionHumanExerciseKey.IKey {
  const joints: (weight: number) => IAutoMovieMotionHumanPosture["joints"] =
    prepareHumanShapeBlend(a.joints, b.joints);
  return (share: number): IAutoMovieMotionHumanExerciseKey.IKey => ({
    pitch: a.pitch + (b.pitch - a.pitch) * share,
    roll: a.roll + (b.roll - a.roll) * share,
    yaw: a.yaw + (b.yaw - a.yaw) * share,
    lift: a.lift + (b.lift - a.lift) * share,
    joints: joints(share),
  });
}
