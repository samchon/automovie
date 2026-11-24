import type { IAutoMovieMotionHumanWalkGait } from "@automovie/interface";
import { walk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one fourth root and product, hip heights. */
const ROUNDING: number = 1e-12;

/**
 * `walk.walking` is the walking gait of a Froude number: a step of `1.2
 * Fr^0.25` hip heights (Grieve and Gear 1966) no longer than
 * `walk.longestStep()`, 40 % of the stride in swing, the mid-swing lift
 * `walk.LIFT`, and arms swinging 15 degrees with the elbow bent 22.5 and
 * swinging 7.5 either way (Perry and Burnfield), the trunk leaning 3.
 *
 * Scenarios:
 *
 * 1. The gait carries its Froude number.
 * 2. A slow step, Fr = 0.01, is `1.2 * 0.01^0.25 = 0.3795` hip heights.
 * 3. At Fr = 0.25, `1.2 * 0.25^0.25 = 0.849` exceeds the longest step, which caps
 *    it.
 * 4. The swing share, the lift, the arms and the lean are the constants.
 * 5. Sixteen times a short step's Froude number doubles it.
 */
export function test_unit_motions_actions_walk_walking(): void {
  const gait: IAutoMovieMotionHumanWalkGait = walk.walking(0.25);

  // 1. Its Froude number.
  TestValidator.equals("the Froude number", gait.froude, 0.25);

  // 2. The square root of the speed's scale.
  TestValidator.predicate(
    "a slow step",
    nclose(gait.step(0.01), 1.2 * Math.sqrt(Math.sqrt(0.01)), ROUNDING),
  );

  // 3. Capped at the longest step.
  TestValidator.predicate(
    "capped at the longest step",
    1.2 * Math.sqrt(Math.sqrt(0.25)) > walk.longestStep() &&
      nclose(gait.step(0.25), walk.longestStep(), ROUNDING),
  );

  // 4. The constants.
  TestValidator.equals(
    "the swing, arms and lean",
    [gait.swing, gait.arms, gait.lean],
    [0.8, { shoulder: 15, elbow: 22.5, swing: 7.5 }, 3],
  );
  TestValidator.predicate("the lift", nclose(gait.lift, walk.LIFT, ROUNDING));

  // 5. Sixteen times the Froude number doubles a short step.
  const slow: number = 1 / 256;
  TestValidator.predicate(
    "the fourth-root scaling",
    nclose(gait.step(16 * slow), 2 * gait.step(slow), ROUNDING),
  );
}
