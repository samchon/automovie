import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An unenforced owner cannot authenticate an existing publication.
 *
 * Scenarios:
 * 1. Unenforced evidence and compatible review edges remain refused even
 *    when their review metadata is true.
 */
export const test_production_library_publication_unenforced = (): void => {
  for (const stage of ["evidence", "review"])
    TestValidator.equals(
      `unenforced ${stage} remains refused`,
      inspectLibraryCompletionPublication([
        libraryCompletionBinding({ stage, enforced: false, reviewed: true }),
      ]),
      ["library-owner-mismatch"],
    );
};
