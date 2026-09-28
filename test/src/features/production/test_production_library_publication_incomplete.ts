import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An existing publication cannot borrow completion from review metadata.
 *
 * Scenarios:
 * 1. Draft, disabled, and unknown owner stages with true review metadata
 *    refuse the otherwise identical indexed publication.
 */
export const test_production_library_publication_incomplete = (): void => {
  for (const stage of ["draft", "disabled", "source"])
    TestValidator.equals(
      `incomplete ${stage} cannot authenticate an indexed export`,
      inspectLibraryCompletionPublication([
        libraryCompletionBinding({ stage, reviewed: true }),
      ]),
      ["library-owner-mismatch"],
    );
};
