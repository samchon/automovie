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
