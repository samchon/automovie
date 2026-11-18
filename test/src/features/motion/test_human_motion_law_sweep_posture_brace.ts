import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Each brace pattern remains admissible through its entry and release.
 *
 * Scenarios:
 * 1. The omitted kind exercises the default response.
 * 2. The other declared modes distinguish the corresponding load and arm shapes against the original world target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations Neither mode can exceed the ordinary motion and contact limits of that body. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The omitted kind exercises the default response. The other declared modes distinguish the corresponding load and arm shapes against the original world target.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_brace(): void {
  TestValidator.equals(
    "Each brace pattern remains admissible through its entry and release",
    motionPostureBranches([
      ["brace", "default", "f-small"],
      ["brace", "kind=push", "m-large"],
      ["brace", "kind=catchBody", "f-small"],
    ]),
    [],
  );
}
