import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * A completed owner with different source bytes cannot authenticate an export.
 *
 * Scenarios:
 * 1. Changing only the current owner edge's source digest refuses an
 *    otherwise identical indexed export, preserving byte identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Changes only the current completed owner's source digest while reopening the existing publication and requires library-owner-mismatch, detecting admission based solely on address or completion.
 * @evidence contracts/testing.md#independent-expectations The publication uses the original synthetic digest while the supplied edge uses a distinct literal digest, so exact source identity must disagree; this tests digest binding rather than independent SHA-256 computation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the changed-digest twin with stage/enforcement/address fixed; unchanged completed, missing owner and unexecuted completed/draft cases are owned by neighboring publication tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_publication_digest owns one portable memory-publication case with caller-supplied identities and no disk write, native artifact build or production host.
 */
export function test_production_library_publication_digest(): void {
  TestValidator.equals(
    "completion does not relax source digest identity",
    inspectLibraryCompletionPublication([
      libraryCompletionBinding({ sourceDigest: `sha256:${"3".repeat(64)}` }),
    ]),
    ["library-owner-mismatch"],
  );
}
