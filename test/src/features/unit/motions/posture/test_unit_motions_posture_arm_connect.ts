import { HumanArmConnect } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Binary64 error for subtracting and multiplying numbers of magnitude at most
 * ten before checking a velocity bound: four rounded operations consume
 * at most four units of roundoff at that magnitude.
 */
const RATE_ROUNDING: number = 4 * 10 * Number.EPSILON;

/**
 * RRT-Connect meets an obstacle at its actual time and joins valid poses
 * without surpassing the rate bound.
 *
 * Scenarios:
 *
 * 1. The straight line from (-1, 0) to (1, 1) is blocked between 0.4 and
 *    0.6 seconds. The route can cross earlier; reaching 0.3 by 0.4 takes
 *    at least 3.25 units/s, below the limit of 10.
 * 2. An invalid goal returns null.
 */
export function test_unit_motions_posture_arm_connect(): void {
  const valid = (q: readonly number[]): boolean =>
    q[1]! < 0.4 || q[1]! > 0.6 || q[0]! >= 0.3;
  const query: HumanArmConnect.IQuery = {
    start: [-1, 0],
    goal: [1, 1],
    low: [-2],
    high: [2],
    discs: [],
    valid,
    seconds: 1,
    velocities: [10],
  };
  const found: number[][] | null = HumanArmConnect.connect(query);
  TestValidator.predicate(
    "a route with an interior detour",
    found !== null && found.length > 2,
  );
  const path: number[][] = found!;
  TestValidator.equals("the route's endpoints", [path[0], path.at(-1)], [
    [...query.start],
    [...query.goal],
  ]);
  TestValidator.predicate(
    "every edge respects time, rate and the gate",
    path.slice(1).every((after: number[], i: number): boolean => {
      const before: number[] = path[i]!;
      const dt: number = after[1]! - before[1]!;
      if (dt <= 0 || Math.abs(after[0]! - before[0]!) > 10 * dt + RATE_ROUNDING)
        return false;
      // At least one full validation substep separates the tested gate's
      // interior from each edge of the authored time restriction.
      const low: number = Math.max(before[1]!, 0.42);
      const high: number = Math.min(after[1]!, 0.58);
      if (low > high) return true;
      const at = (seconds: number): number =>
        before[0]! + ((after[0]! - before[0]!) * (seconds - before[1]!)) / dt;
      return Math.min(at(low), at(high)) >= 0.3 - RATE_ROUNDING;
    }),
  );
  TestValidator.equals(
    "the invalid endpoint is refused",
    HumanArmConnect.connect({ ...query, goal: [0, 0.5] }),
    null,
  );
}
