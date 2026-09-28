import { TestValidator } from "@nestia/e2e";

import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An indexed export with no owner edge is refused.
 *
 * Scenarios:
 * 1. An empty current owner population refuses one indexed delivery export,
 *    guarding exact owner presence at publication reopening.
 */
export const test_production_library_publication_missing_owner = (): void => {
  TestValidator.equals(
    "publication requires its exact current owner edge",
    inspectLibraryCompletionPublication([]),
    ["library-owner-mismatch"],
  );
};
