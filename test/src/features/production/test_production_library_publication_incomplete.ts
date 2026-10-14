import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An indexed publication cannot grant completion to an unfinished owner.
 *
 * Scenarios:
 * 1. Draft, disabled, and unknown owner stages with exact source bindings
 *    refuse the otherwise identical indexed publication.
 *
 * @evidence contracts/testing.md#behavioral-verification Reopens an indexed library publication against unfinished owner stages and requires library-owner-mismatch, preventing index contents from granting source completion.
 * @evidence contracts/testing.md#independent-expectations Literal library-owner-mismatch follows the owner-completion requirement independently of the inspected result; the shared fixture supplies matching publication data and does not prove on-disk publication safety.
 * @evidence contracts/testing.md#distinguishing-cases Draft, disabled and unknown stages vary only completion; execution completion and publication enforcement scenarios are owned by adjacent tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns three in-memory publication cases through the existing inspection fixture and starts no installed consumer or production host.
 */
export function test_production_library_publication_incomplete(): void {
  for (const stage of ["draft", "disabled", "source"])
    TestValidator.equals(
      `incomplete ${stage} cannot authenticate an indexed export`,
      inspectLibraryCompletionPublication([
        libraryCompletionBinding({ stage, }),
      ]),
      ["library-owner-mismatch"],
    );
}
