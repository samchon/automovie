import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionInterval } from "../../compose/internal/AutoMovieMotionInterval";

/*
 * Samples the car exit's ankle path. The ankle lifts inside, crosses above the
 * sill at the supplied minimum clearance height and lowers outside.
 */
export function carExitAnkleAt(
  start: IAutoMovieVector3,
  sill: IAutoMovieVector3,
  end: IAutoMovieVector3,
  clearanceHeight: number,
  phase: number,
  liftShare: number,
): IAutoMovieVector3 {
  const at: IAutoMovieVector3 =
    phase <= 0.5
      ? AutoMovieEngineVector3.lerp(
          start,
          sill,
          AutoMovieMotionInterval.progress(liftShare, 0.5, phase),
        )
      : AutoMovieEngineVector3.lerp(
          sill,
          end,
          AutoMovieMotionInterval.progress(0.5, 1 - liftShare, phase),
        );
  const high: number = Math.max(start.y, end.y, clearanceHeight);
  const height: number =
    phase < 0.5
      ? start.y +
        (high - start.y) * AutoMovieMotionInterval.progress(0, liftShare, phase)
      : end.y +
        (high - end.y) *
          (1 - AutoMovieMotionInterval.progress(1 - liftShare, 1, phase));
  return { ...at, y: height };
}
