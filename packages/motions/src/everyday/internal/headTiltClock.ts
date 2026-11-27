import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanHeadTilt,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { HumanBound } from "../../law/HumanBound";

/**
 * A head tilt's clock: the phrase, 0.9 seconds when unstated and at least 0.6,
 * in thirds, the roll rising to its peak at `stroke` over the first, holding
 * through the second and returning from `relax` over the last. The 0.6 second
 * minimum leaves 0.2 seconds for the carrier's fade at each end.
 *
 * @param params The authored tilt; only its duration is read.
 * @returns The clock with the phrase's instants.
 * @throws {HumanRefusal} If the duration is below 0.6 seconds.
 */
export function headTiltClock(
  params: Pick<IAutoMovieMotionHumanHeadTilt, "duration">,
): IAutoMovieMotionClock {
  const seconds: number = HumanBound.least(
    "seconds",
    params.duration ?? 0.9,
    0.6,
    "s",
  );
  return AutoMovieMotionClock(seconds, [
    { name: "ready", seconds: 0 },
    { name: "strokeStart", seconds: 0 },
    { name: "stroke", seconds: seconds / 3 },
    { name: "strokeEnd", seconds: (2 / 3) * seconds },
    { name: "relax", seconds: (2 / 3) * seconds },
  ]);
}