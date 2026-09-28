import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * A completed owner with different source bytes cannot authenticate an export.
 *
 * Scenarios:
 * 1. Changing only the current owner edge's source digest refuses an
 *    otherwise identical indexed export, preserving byte identity.
 */
export const test_production_library_publication_digest = (): void => {
  TestValidator.equals(
    "completion does not relax source digest identity",
    inspectLibraryCompletionPublication([
      libraryCompletionBinding({ sourceDigest: `sha256:${"3".repeat(64)}` }),
    ]),
    ["library-owner-mismatch"],
  );
};
