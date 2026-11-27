import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanAdaptiveKnots } from "../../posture/internal/prepareHumanAdaptiveKnots";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

/*
 * Interpolate observed elbow hints while the hand keeps its exact goal.
 */
export function prepareHumanElbowPath(
  duration: number,
  events: readonly number[],
  request: (seconds: number) => IAutoMovieMotionHumanBend.ISolve,
): (seconds: number) => IAutoMovieVector3 {
  const { course }: prepareHumanAdaptiveKnots.IKnots =
    prepareHumanAdaptiveKnots({
      from: 0,
      to: duration,
      requiredTimes: events,
      tolerance: { kind: "absolute", absolute: 0.002 },
      maxKnots: 64,
      evaluate: (seconds: number): readonly number[] => {
        const elbow: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve(
          request(seconds),
        );
        return [elbow.x, elbow.y, elbow.z];
      },
    });
  return (seconds: number): IAutoMovieVector3 => {
    const [x, y, z]: number[] = course.position(seconds);
    return { x: x!, y: y!, z: z! };
  };
}
