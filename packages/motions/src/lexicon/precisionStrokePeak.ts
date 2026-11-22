import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { courseArmGoal } from "../compose/courseArmGoal";

/** The step a stroke's hand path is read at, seconds: 240 Hz, ten samples per film frame. */
const STEP: number = 1 / 240;

/**
 * The delivery peak of a stroke's arm: the greatest speed its hand goal
 * travels at over the stroke, read along the whole path the stroke writes
 * for it (the swing, the body's turn and the address together), so the arm's
 * course is admitted against the stroke's own speed (`courseArmGoal`'s
 * `pace`).
 *
 * @param posture The stroke's posture, which writes the arm's goal.
 * @param limb The striking arm.
 * @param duration The stroke's seconds.
 * @returns Metres per second; zero when the stroke writes no goal for the arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, over which path, its unit and the case of no goal.
 * @evidence contracts/development/implementation.md#principled-implementation The pace is the law's own: the hand goal's speed along the path the stroke writes, the swing composed with the body's turn and address, which no closed form of the swing alone gives.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the stroke at a fixed step, keeping the previous point.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No constant is added to the speed read; a goal absent at an instant breaks no difference across it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the stroke's seconds at 240 Hz; the posture writes goals without solving the limbs, and the caller reads it once per stroke.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the posture handed in.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one point while it reads and nothing after it returns.
 */
export function precisionStrokePeak(
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  limb: courseArmGoal.Limb,
  duration: number,
): number {
  let fastest: number = 0;
  let last: IAutoMovieVector3 | undefined;
  let before: number = 0;
  const count: number = Math.ceil(duration / STEP);
  for (let i: number = 0; i <= count; i++) {
    const seconds: number = Math.min(duration, i * STEP);
    const point: IAutoMovieVector3 | undefined =
      posture(seconds).limbs[limb]?.point;
    if (point !== undefined && last !== undefined && seconds > before)
      fastest = Math.max(
        fastest,
        Vector3.length(Vector3.subtract(point, last)) / (seconds - before),
      );
    last = point;
    before = seconds;
  }
  return fastest;
}
