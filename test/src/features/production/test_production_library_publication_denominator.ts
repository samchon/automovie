import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * The publication denominator contains every completed source owner.
 *
 * Scenarios:
 * 1. One completed delivery edge omitted from the empty publication index
 *    produces an owner mismatch rather than disappearing from the denominator.
 */
export const test_production_library_publication_denominator = (): void => {
  TestValidator.equals(
    "an unexecuted completed source is refused",
    inspectLibraryCompletionPublication([libraryCompletionBinding()], false),
    ["library-owner-mismatch"],
  );
};
