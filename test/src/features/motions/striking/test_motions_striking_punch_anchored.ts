import {
  punchAnchored
} from "../../../../../packages/motions/src/striking/internal/punchAnchored";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * An anchored punch's correction share (`punchAnchored.share`): the arm is
 * carried toward a correction's anchor on the minimum-jerk share of its own
 * span.
 *
 * Scenario: a correction from 0.2 s lasting 0.4 s has carried none by 0.2 s,
 * half by 0.4 s and all by 0.6 s and after.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines one minimum-jerk share per animated arm correction.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the share at start, midpoint, end and after a 0.4 s correction that begins at 0.2 s.
 * @evidence contracts/development/testing.md#independent-expectations Symmetry of the blend gives 0, 0.5 and 1 at 0.2, 0.4 and 0.6 s, with the terminal share retained.
 */
export function test_motions_striking_punch_anchored(): void {
  const c = { start: 0.2, duration: 0.4 };
  TestValidator.predicate(
    "the share",
    nclose(punchAnchored.share(0.2, c), 0, 1e-12) &&
      nclose(punchAnchored.share(0.4, c), 0.5, 1e-12) &&
      nclose(punchAnchored.share(0.6, c), 1, 1e-12) &&
      nclose(punchAnchored.share(1, c), 1, 1e-12),
  );
}
