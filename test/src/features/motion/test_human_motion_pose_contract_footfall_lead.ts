import { TestValidator } from "@nestia/e2e";

import { WalkPace } from "../../../../packages/motions/src/actions/WalkPace";
import { nclose } from "../internal/nclose";

/**
 * Swing duration decides whether both feet can share support at landing.
 *
 * Scenarios:
 * 1. Just below and at one period, the landing is half a step ahead.
 * 2. Just above one period, midstance bisects contact, measured at the
 *    centre of pressure. Its offset from the ankle reduces the ankle lead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the support transition and the two frames used to locate a landing.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the lead used to place a footprint at the instant of contact.
 * @evidence contracts/development/testing.md#independent-expectations For a one-metre step the centre-of-pressure offset in metres equals its step fraction. Contact lasts two periods less the swing, so half of contact gives the centre's landing lead.
 * @evidence contracts/development/testing.md#distinguishing-cases A one-millisecond change around a one-second period crosses the shared-support boundary. A nonzero offset distinguishes the flight branch at equality.
 * @evidence contracts/development/testing.md#execution-ownership Constructs three constant-size pace plans without a scene or a body.
 */
export function test_human_motion_pose_contract_footfall_lead(): void {
  const period: number = 1;
  const offset: number = 0.1;
  for (const swing of [0.999, 1, 1.001]) {
    const pace: WalkPace = new WalkPace({
      steps: 4,
      longest: 1,
      distance: 4,
      speed: 1,
      share: swing / period,
      lead: offset,
      period: (): number => period,
    });
    const contact: number = 2 * period - swing;
    const expected: number = swing <= period ? 0.5 : contact / (2 * period) - offset;
    TestValidator.predicate(
      `landing lead at ${swing} periods of swing`,
      nclose(pace.front, expected, 1e-12),
    );
  }
}
