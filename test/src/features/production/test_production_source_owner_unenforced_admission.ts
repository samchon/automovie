import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectSourceOwnerCompletion } from "../internal/inspectSourceOwnerCompletion";

/**
 * A completed stage without an enforced graph edge cannot admit execution.
 *
 * Scenarios:
 *
 * 1. Evidence and compatible review declarations refuse an unenforced edge
 *    while diagnostic resolution preserves its exact identity.
 */
export const test_production_source_owner_unenforced_admission = (): void => {
  for (const stage of ["evidence", "review"])
    TestValidator.equals(
      `unenforced ${stage} cannot complete`,
      inspectSourceOwnerCompletion(
        libraryCompletionBinding({ stage, enforced: false, reviewed: true }),
      ),
      { complete: false, admission: false, sourceDiagnosis: true },
    );
};
