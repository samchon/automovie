import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { courseArmGoal } from "../../compose/internal/courseArmGoal";

/*
 * The delivery peak of a stroke's arm: the greatest speed its hand goal travels
 * at over the stroke, read along the whole path the stroke writes for it (the
 * swing, the body's turn and the address together), so the arm's course is
 * admitted against the stroke's own speed (`courseArmGoal`'s `pace`).
 * Parameter posture: The stroke's posture, which writes the arm's goal.
 * Parameter limb: The striking arm.
 * Parameter duration: The stroke's seconds.
 * Returns: Metres per second; zero when the stroke writes no goal for the arm.
 */
export function precisionStrokePeak(
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  limb: courseArmGoal.Limb,
  duration: number,
): number {
  return sample(duration, (seconds): readonly Point[] => [
    posture(seconds).limbs[limb]?.point,
  ]);
}

export namespace precisionStrokePeak {
  /*
   * Sample the two wrist points together on the same grid as a single arm.
   * Returns the greatest speed of either wrist, in metres per second.
   */
  export function paired(
    duration: number,
    wrists: (
      seconds: number,
    ) => readonly [IAutoMovieVector3, IAutoMovieVector3],
  ): number {
    return sample(duration, wrists);
  }
}

type Point = IAutoMovieVector3 | undefined;

function sample(
  duration: number,
  points: (seconds: number) => readonly Point[],
): number {
  let fastest: number = 0;
  let last: readonly Point[] = [];
  let before: number = 0;
  const count: number = Math.ceil(duration / STEP);
  for (let i: number = 0; i <= count; i++) {
    const seconds: number = Math.min(duration, i * STEP);
    const current: readonly Point[] = points(seconds);
    if (seconds > before)
      for (let j: number = 0; j < current.length; ++j) {
        const point: Point = current[j];
        const previous: Point = last[j];
        if (point !== undefined && previous !== undefined)
          fastest = Math.max(
            fastest,
            AutoMovieEngineVector3.length(
              AutoMovieEngineVector3.subtract(point, previous),
            ) /
              (seconds - before),
          );
      }
    last = current;
    before = seconds;
  }
  return fastest;
}

/*
 * The step a stroke's hand path is read at, seconds: 240 Hz, ten samples per
 * film frame.
 */
const STEP: number = 1 / 240;
