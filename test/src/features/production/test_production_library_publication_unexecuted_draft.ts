import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An incomplete unexecuted edge creates no completed-publication obligation.
 *
 * Scenarios:
 * 1. An unexecuted draft edge beside an empty publication produces no owner
 *    mismatch, guarding the incomplete edge's denominator boundary.
 */
export const test_production_library_publication_unexecuted_draft =
  (): void => {
    TestValidator.equals(
      "an unexecuted draft is outside the completed denominator",
      inspectLibraryCompletionPublication(
        [libraryCompletionBinding({ stage: "draft" })],
        false,
      ),
      [],
    );
  };
