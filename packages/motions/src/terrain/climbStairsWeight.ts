import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionClock } from "@automovie/interface";

/**
 * The fraction of body weight the right foot bears along the stair clock.
 * A single support bears all the weight. During double support the performer
 * transfers it between the two feet, entering and leaving in a balanced stand.
 *
 * @param sides The foot lifted on each step in event order.
 * @param clock The final clock that also schedules the footprints.
 * @returns Right-foot load from zero to one at a local action second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the side, time frame, phase boundaries and units of the result.
 * @evidence contracts/development/implementation.md#principled-implementation Each swing fixes the opposite support's whole load; double support interpolates adjacent loads with zero endpoint velocity and acceleration.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered list of takeoff and touchdown knots plus the entry and exit stands drives the lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every event uses its authored time and bearing side, including the last gathering step.
 * @evidence contracts/development/implementation.md#efficient-algorithms The plan prepares two knots per step and finds the surrounding interval in logarithmic time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same clock and step order determine all loads throughout the plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader owns only an array bounded by the scheduled step count.
 */
export function climbStairsWeight(
  sides: readonly ("left" | "right")[],
  clock: IAutoMovieMotionClock,
): (seconds: number) => number {
  const knots: IKnot[] = [{ seconds: 0, right: 0.5 }];
  sides.forEach((side: "left" | "right", index: number): void => {
    const right: number = side === "left" ? 1 : 0;
    knots.push({ seconds: clock.at(`toeOff${index + 1}`), right },
      { seconds: clock.at(`treadContact${index + 1}`), right });
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
    return from.right + (to.right - from.right) *
      minimumJerk.share((seconds - from.seconds) / (to.seconds - from.seconds));
  };
}

/** One support boundary in local seconds with a dimensionless right-foot weight share. */
interface IKnot {
  seconds: number;
  right: number;
}
