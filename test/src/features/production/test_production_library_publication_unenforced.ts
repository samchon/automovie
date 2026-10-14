import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An unenforced owner cannot authenticate an existing publication.
 *
 * Scenarios:
 * 1. Unenforced evidence and compatible review edges remain refused despite
 *    their completed stages and matching publication identities.
 *
 * @evidence contracts/testing.md#behavioral-verification Inspects an indexed publication with unenforced completed owner edges and requires library-owner-mismatch, catching reopening that ignores enforcement.
 * @evidence contracts/testing.md#independent-expectations The literal refusal code derives from the required enforced owner edge; matching index metadata cannot satisfy that requirement, and this oracle does not cover filesystem integrity.
 * @evidence contracts/testing.md#distinguishing-cases Evidence and compatible review stages both remain refused when enforcement is false; incomplete stages and successful execution plans are owned by adjacent tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns both in-memory publication cases through the existing fixture without installation, native build or a production host.
 */
export function test_production_library_publication_unenforced(): void {
  for (const stage of ["evidence", "review"])
    TestValidator.equals(
      `unenforced ${stage} remains refused`,
      inspectLibraryCompletionPublication([
        libraryCompletionBinding({ stage, enforced: false, }),
      ]),
      ["library-owner-mismatch"],
    );
}
