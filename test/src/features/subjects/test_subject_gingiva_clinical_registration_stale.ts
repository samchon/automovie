import { TestValidator } from "@nestia/e2e";

import { prepareGingivaBasis } from "../../../scripts/face-review/prepareGingivaBasis";
import { prepareGingivaScallopBasis } from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";
import { throwsError } from "../internal/predicates";

/**
 * A landmark registration belongs to one exact source revision. Its finite
 * coordinates do not allow applying it to a different basis silently.
 *
 * Scenarios:
 * 1. Keep the valid dentition and every anchor unchanged, but change the
 *    registration's revision. Both consumers refuse before publishing output.
 */
export const test_subject_gingiva_clinical_registration_stale = (): void => {
  const { base } = gingivaScallopFixture();
  const registrations = new Map([...base.registrations].map(([component, one]) =>
    [component, { ...one, basisRevision: "unrelated-source" }]));
  for (const prepare of [prepareGingivaBasis, prepareGingivaScallopBasis])
    TestValidator.predicate("stale registration refuses in the real norm consumer",
      throwsError(() => prepare({ ...base, registrations }), ["this exact basis"]));
};
