import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * Completed library owners reopen without review metadata.
 *
 * Scenarios:
 * 1. Evidence and compatible review edges authenticate the identical
 *    publication and produce no owner mismatch.
 */
export const test_production_library_publication_completion = (): void => {
  TestValidator.equals(
    "completed edges authenticate the same publication",
    [
      inspectLibraryCompletionPublication([libraryCompletionBinding()]),
      inspectLibraryCompletionPublication([
        libraryCompletionBinding({ stage: "review" }),
      ]),
    ],
    [[], []],
  );
};
