import { TestValidator } from "@nestia/e2e";

import { motionBladeSeed } from "../internal/motionBladeSeed";

/**
 * A seed varies a take of a lunge without moving where its point lands, and
 * the same seed replays the take.
 *
 * The landing bound is the campaign's 15 mm contact bound at the decisive
 * instant; a replay is the same film, compared to a nanosecond and a
 * micrometre.
 *
 * Scenarios, on the average man lunging with an arming
 * sword at a pell 0.91 of the stature away, trained:
 * 1. Under two seeds, at each take's decisive instant the point is within
 *    15 mm of the pell's target, and the two takes do not have the same
 *    decisive instant.
 * 2. The first seed built again gives the same decisive instant and the same
 *    point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain and input and reads the displayed sword point; a seed that moves the landing, a seed that changes nothing, or a take that does not replay fails.
 * @evidence contracts/development/testing.md#independent-expectations The landing bound is the campaign's; that seeds differ and that one seed repeats is the variation contract. A law that ignored its seed or drew outside its stream fails one of the two; the test does not judge the size of the variation, which the variation report owns.
 * @evidence contracts/development/testing.md#distinguishing-cases Two seeds and a repeated seed on the average man; the other body of opposite build is its own spec, so each runs under a minute, and skill is the blade skill test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds three films (`motionBladeSeed`), each about 20 s while taking a tool for a use costs that; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bounds and the 2 scenarios.
 */
export function test_human_motion_blade_seed_m_average(): void {
  TestValidator.equals(
    "a seed varies a lunge and replays it",
    motionBladeSeed("m-average"),
    [],
  );
}
