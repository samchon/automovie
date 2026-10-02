import { TestValidator } from "@nestia/e2e";

import { prepareGingivaBasis } from "../../../scripts/face-review/prepareGingivaBasis";
import { prepareGingivaScallopBasis } from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";
import { throwsError } from "../internal/predicates";

/**
 * Both norm-driven consumers require actual registration rather than treating
 * the visible raster as clinical landmarks. The known fixture passes with its
 * independent registration in the normal preparation scenarios.
 *
 * Scenarios:
 * 1. Remove only registration from the valid box dentition. Both preparations
 *    refuse with the missing-registration cause and retain caller geometry.
 */
export const test_subject_gingiva_clinical_registration_missing = (): void => {
  const { base } = gingivaScallopFixture();
  const before = JSON.stringify(base.basis);
  for (const prepare of [prepareGingivaBasis, prepareGingivaScallopBasis])
    TestValidator.predicate("unregistered proxy cannot drive a clinical norm",
      throwsError(() => prepare({ ...base, registrations: undefined }), ["landmark registration"]));
  TestValidator.equals("registration refusal retains caller geometry", JSON.stringify(base.basis), before);
};
