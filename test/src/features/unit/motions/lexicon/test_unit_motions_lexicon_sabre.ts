import { HumanSabreForm, humanSabreCharge } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The `HumanSabre` law's charge (`humanSabreCharge`): a mounted sabre comes to
 * the engage within one gallop stride (`STRIDE`, 0.5 s), cued `charge` and
 * `engaged` on the carry.
 *
 * Scenarios:
 *
 * 1. A 4 s carry charging at 3 s over 0.4 s cues the charge at 0.75 and the engage
 *    at 0.85; a carry without a charge has no cue.
 * 2. A transition longer than the stride, or a carry of no length, is refused.
 */
export function test_unit_motions_lexicon_sabre(): void {
  TestValidator.equals(
    "the charge's cues",
    [
      humanSabreCharge.events({ duration: 4, transition: 0.4 }, 3),
      humanSabreCharge.events({ duration: 4, transition: 0.4 }, undefined),
    ],
    [
      [
        { name: "charge", share: 0.75 },
        { name: "engaged", share: 0.85 },
      ],
      [],
    ],
  );
  TestValidator.predicate(
    "past a stride, or no carry",
    HumanSabreForm.STRIDE === 0.5 &&
      throwsError(() => humanSabreCharge({ duration: 4, transition: 0.6 })) &&
      throwsError(() => humanSabreCharge({ duration: 0, transition: 0.4 })),
  );
}
