import { TestValidator } from "@nestia/e2e";

import { assertHumanViewerSource } from "../../../scripts/human-viewer/assertHumanViewerSource";
import { throwsError } from "../internal/predicates";

/**
 * Last-good fallback availability does not certify a new candidate generation.
 *
 * Scenarios:
 * 1. Successful compilation admits the candidate; a reported source error
 *    refuses with the actual cause, including an empty reported error.
 * 2. Clearing the compiler error admits recovery without a new timeout policy.
 */
export const test_human_viewer_source_admission = (): void => {
  assertHumanViewerSource(null);
  TestValidator.predicate("source failure refuses candidate", throwsError(
    () => assertHumanViewerSource("missing import"), "missing import"));
  TestValidator.predicate("empty reported failure also refuses", throwsError(
    () => assertHumanViewerSource(""), "Current source error"));
  assertHumanViewerSource(null);
};
