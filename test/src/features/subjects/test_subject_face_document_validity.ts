import { TestValidator } from "@nestia/e2e";

import { faceValidScale } from "../../../scripts/face-review/faceDocumentValidity";
import { throwsError } from "../internal/predicates";

/**
 * The largest share of the priors' departure at which a document's skin has
 * no fault.
 * Scenarios:
 * 1. A document whole at full priors keeps them (one evaluation).
 * 2. One faulting past 0.3 of them is scaled to the largest bisection step
 *    below 0.3 (0.296875 after six halvings), faultless.
 * 3. One whose measured controls alone make faults keeps every prior that
 *    adds none (all of them when the count stays, 0.25 of them when more
 *    than a quarter adds) and reports the measured controls' faults.
 * 4. Fewer than one step refuses.
 */
export const test_subject_face_document_validity = (): void => {
  const seen: number[] = [];
  const whole = faceValidScale({
    faults: (scale) => {
      seen.push(scale);
      return 0;
    },
    steps: 6,
  });
  const threshold = faceValidScale({
    faults: (scale) => (scale > 0.3 ? 12 : 0),
    steps: 6,
  });
  const measured = faceValidScale({ faults: () => 4, steps: 6 });
  const adding = faceValidScale({
    faults: (scale) => (scale > 0.25 ? 9 : 4),
    steps: 2,
  });
  TestValidator.predicate(
    "scales",
    whole.scale === 1 &&
      whole.faults === 0 &&
      seen.join() === "1" &&
      threshold.scale === 0.296875 &&
      threshold.faults === 0 &&
      measured.scale === 1 &&
      measured.faults === 4 &&
      adding.scale === 0.25 &&
      adding.faults === 4,
  );
  TestValidator.predicate(
    "refusal",
    throwsError(
      () => faceValidScale({ faults: () => 0, steps: 0 }),
      "one step or more",
    ),
  );
};
