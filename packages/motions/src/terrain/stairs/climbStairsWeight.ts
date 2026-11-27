import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
} from "@automovie/interface";

/**
 * The fraction of body weight the right foot bears along the stair clock. A
 * single support bears all the weight. During double support the performer
 * transfers it between the two feet, entering and leaving in a balanced stand.
 *
 * @param sides The foot lifted on each step in event order.
 * @param clock The final clock that also schedules the footprints.
 * @returns Right-foot load from zero to one at a local action second.
 */
export function climbStairsWeight(
  sides: readonly AutoMovieHumanSide[],
  clock: IAutoMovieMotionClock,
): (seconds: number) => number {
  const knots: IKnot[] = [{ seconds: 0, right: 0.5 }];
  sides.forEach((side: AutoMovieHumanSide, index: number): void => {
    const right: number = side === "left" ? 1 : 0;
    knots.push(
      { seconds: clock.at(`toeOff${index + 1}`), right },
      { seconds: clock.at(`treadContact${index + 1}`), right },
    );
  });
  knots.push({ seconds: clock.duration, right: 0.5 });
  return (seconds: number): number => {
    let low: number = 0;
    let high: number = knots.length - 1;
    while (high - low > 1) {
      const middle: number = (low + high) >>> 1;
      if (seconds < knots[middle]!.seconds) high = middle;
      else low = middle;
    }
    const from: IKnot = knots[low]!;
    const to: IKnot = knots[high]!;
    if (from.right === to.right) return from.right;
    return (
      from.right +
      (to.right - from.right) *
        AutoMovieEngineMotionSampling.minimumJerkShare(
          (seconds - from.seconds) / (to.seconds - from.seconds),
        )
    );
  };
}

/**
 * One support boundary in local seconds with a dimensionless right-foot weight
 * share.
 */
interface IKnot {
  seconds: number;
  right: number;
}
