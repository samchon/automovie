import {
  FootStrikeLeg
} from "../../../../../packages/motions/src/striking/internal/FootStrikeLeg";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * A foot strike's raised foot (`FootStrikeLeg.raised`): along the floor by one
 * share and up by another, so the foot lifts before it travels.
 *
 * Scenario: from (0, 0, 0) to (1, 2, 1), a tenth along and half up is (0.1, 1,
 * 0.1); all along and none up is (1, 0, 1).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines independent horizontal and vertical progression of a virtual ankle goal.
 * @evidence contracts/development/testing.md#behavioral-verification Raises a target from the origin with unequal horizontal and vertical shares and with no vertical share.
 * @evidence contracts/development/testing.md#independent-expectations Component scaling of (1, 2, 1) by (0.1, 0.5, 0.1) gives (0.1, 1, 0.1). No vertical share leaves y = 0.
 */
export function test_motions_striking_foot_strike_leg(): void {
  const from = { x: 0, y: 0, z: 0 };
  const to = { x: 1, y: 2, z: 1 };
  TestValidator.predicate(
    "raised",
    vclose(
      FootStrikeLeg.raised(from, to, 0.1, 0.5),
      { x: 0.1, y: 1, z: 0.1 },
      1e-12,
    ) &&
      vclose(FootStrikeLeg.raised(from, to, 1, 0), { x: 1, y: 0, z: 1 }, 1e-12),
  );
}
