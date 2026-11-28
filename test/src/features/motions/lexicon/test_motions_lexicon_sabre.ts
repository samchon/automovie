import {
  HumanSabreForm
} from "../../../../../packages/motions/src/lexicon/internal/HumanSabreForm";
import {
  humanSabreCharge
} from "../../../../../packages/motions/src/lexicon/internal/humanSabreCharge";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines animation cue mapping for a stage prop entering its carried pose, plus a bounded transition.
 * @evidence contracts/development/testing.md#behavioral-verification Schedules one timed cue and one no-cue clip, then tries a transition exceeding its accepted duration and an empty clip.
 * @evidence contracts/development/testing.md#independent-expectations A four-second source maps 3.0 and 3.4 s to 0.75 and 0.85. No-cue input yields no overlay and invalid timing refuses.
 */
export function test_motions_lexicon_sabre(): void {
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
