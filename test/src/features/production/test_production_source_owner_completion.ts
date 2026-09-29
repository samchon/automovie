import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectSourceOwnerCompletion } from "../internal/inspectSourceOwnerCompletion";

/**
 * Enforced evidence completes independently of optional review metadata.
 *
 * Scenarios:
 *
 * 1. Evidence and compatible review edges with either review value admit
 *    execution and resolve the same exact identity during source diagnosis.
 */
export const test_production_source_owner_completion = (): void => {
  for (const stage of ["evidence", "review"])
    for (const reviewed of [false, true])
      TestValidator.equals(
        `completed ${stage}/${reviewed} admits execution`,
        inspectSourceOwnerCompletion(
          libraryCompletionBinding({ stage, reviewed }),
        ),
        { complete: true, admission: true, sourceDiagnosis: true },
      );
};
