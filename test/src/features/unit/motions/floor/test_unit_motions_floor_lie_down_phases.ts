import type { IAutoMovieMotionClockPhase } from "@automovie/interface";
import { lieDown, lieDownPhases } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `lieDownPhases` lays the lie's clock out: `getDown` and each route arrival
 * but the last take `lieDown.PHASE` seconds, the last arrival takes none, and
 * the settled hold takes the authored hold.
 *
 * Scenarios:
 *
 * 1. A three-key route held 2 s has `getDown`, the first two arrivals at
 *    `PHASE` each, the last arrival at 0 and `settled` at 2.
 * 2. A one-key route has `getDown`, its arrival at 0 and the hold.
 */
export function test_unit_motions_floor_lie_down_phases(): void {
  const phase: number = lieDown.PHASE;
  TestValidator.equals(
    "a three-key route",
    lieDownPhases({
      route: [
        ["sit", "seatContact"],
        ["lean", "elbowsDown"],
        ["supine", "supine"],
      ],
      hold: 2,
    }),
    [
      { name: "getDown", seconds: phase },
      { name: "seatContact", seconds: phase },
      { name: "elbowsDown", seconds: phase },
      { name: "supine", seconds: 0 },
      { name: "settled", seconds: 2 },
    ] satisfies IAutoMovieMotionClockPhase[],
  );
  TestValidator.equals(
    "a one-key route",
    lieDownPhases({ route: [["prone", "prone"]], hold: 0.5 }),
    [
      { name: "getDown", seconds: phase },
      { name: "prone", seconds: 0 },
      { name: "settled", seconds: 0.5 },
    ] satisfies IAutoMovieMotionClockPhase[],
  );
}
