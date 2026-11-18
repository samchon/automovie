import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * A full hands-down support transfer holds its original feet on both extreme rigs.
 *
 * Scenarios:
 * 1. From a two-foot stance, both palms share support before the return to two feet.
 * 2. The same authored transfer on the other extreme body demands the same contact precision.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The original contact, floor and continuity limits apply to all four bearing parts. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases From a two-foot stance, both palms share support before the return to two feet. The same authored transfer on the other extreme body demands the same contact precision.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_support(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = motionPostureBranches([
    ["support", "default", "f-small"],
    ["support", "default", "m-large"],
  ], (film, [, , name]): void => {
    const windows: readonly IAutoMovieMotionHumanContactWindow[] = film.segments("a")[0]!.plan.contacts;
    const hands: IAutoMovieMotionHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const) {
      const palm: IAutoMovieMotionHumanContactWindow[] = windows.filter((w): boolean => w.part === `${side}Hand`);
      const foot: IAutoMovieMotionHumanContactWindow[] = windows.filter((w): boolean => w.part === `${side}Foot`);
      complaints.check(`${name}: one interior support interval for the ${side} palm`,
        palm.length === 1 && palm[0]!.from > 0 && palm[0]!.to < 1 && palm[0]!.from < palm[0]!.to);
      complaints.check(`${name}: the ${side} foot bears for the entire transfer`,
        foot.length === 1 && foot[0]!.from === 0 && foot[0]!.to === 1);
      hands.push(...palm);
    }
    if (hands.length === 2)
      complaints.check(`${name}: both palms bear together for a positive interval`,
        Math.max(hands[0]!.from, hands[1]!.from) < Math.min(hands[0]!.to, hands[1]!.to));
  });
  complaints.list.push(...findings);
  complaints.assert("Palms share the landing while both feet keep bearing");
}
