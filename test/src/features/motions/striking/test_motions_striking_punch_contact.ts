import { punchContact } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A low punch's dip (`punchContact.dip`): half the shoulder's height above the
 * target beyond a quarter of the arm, capped at 0.15 of the hip's height, none
 * for a target that high.
 *
 * Scenario: with a 0.9 m hip and a 0.6 m arm, a shoulder at 1.45 m punching at
 * 1.2 m dips 0.05 m; at 0.6 m it would dip 0.35 m but is capped at 0.135 m; at
 * 1.4 m it does not dip.
 */
export function test_motions_striking_punch_contact(): void {
  const m = { hipHeight: 0.9, upperArm: 0.32, forearm: 0.28 };
  TestValidator.predicate(
    "the dip",
    nclose(punchContact.dip(m, 1.45, 1.2), 0.05, 1e-12) &&
      nclose(punchContact.dip(m, 1.45, 0.6), 0.135, 1e-12) &&
      punchContact.dip(m, 1.45, 1.4) === 0,
  );
}
