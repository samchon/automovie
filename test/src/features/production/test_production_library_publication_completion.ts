import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * Completed library owners reopen without review metadata.
 *
 * Scenarios:
 * 1. Evidence and compatible review edges authenticate the identical
 *    publication and produce no owner mismatch.
 *
 * @evidence contracts/testing.md#behavioral-verification Reopens the identical resident zero-payload publication against evidence and review owner edges and asserts no problems, catching rejection of either supported completed stage.
 * @evidence contracts/testing.md#independent-expectations Both declared stages are complete and match the fixture's enforced source/export/owner identity, so literal empty problem arrays follow the admission contract; shared materialization/digest helpers are not independent byte-format or filesystem proofs.
 * @evidence contracts/testing.md#distinguishing-cases Keeps evidence and compatible review as completed twins; draft/disabled/source, missing, unenforced and changed-digest edges are covered by adjacent publication tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_publication_completion owns both portable memory-publication cases; the existing fixture materializes and reads bytes in memory without installation, disk writes or a running production host.
 */
export function test_production_library_publication_completion(): void {
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
}
