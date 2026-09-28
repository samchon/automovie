import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectSourceOwnerCompletion } from "../internal/inspectSourceOwnerCompletion";

/**
 * Incomplete stages cannot borrow a positive legacy review observation.
 *
 * Scenarios:
 *
 * 1. Draft, disabled, and unknown stages refuse execution admission while
 *    exact source diagnosis still resolves those same enforced identities.
 */
export const test_production_source_owner_incomplete_admission = (): void => {
  for (const stage of ["draft", "disabled", "source"])
    TestValidator.equals(
      `incomplete ${stage} remains outside execution`,
      inspectSourceOwnerCompletion(
        libraryCompletionBinding({ stage, reviewed: true }),
      ),
      { complete: false, admission: false, sourceDiagnosis: true },
    );
};
