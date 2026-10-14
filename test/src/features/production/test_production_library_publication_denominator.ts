import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * The publication denominator contains every completed source owner.
 *
 * Scenarios:
 * 1. One completed delivery edge omitted from the empty publication index
 *    produces an owner mismatch rather than disappearing from the denominator.
 *
 * @evidence contracts/testing.md#behavioral-verification Reopens an empty publication with one completed delivery source owner and requires library-owner-mismatch, catching an inspection denominator restricted to only indexed or executed owners.
 * @evidence contracts/testing.md#independent-expectations Every completed source owner owes its own indexed realization, so the deliberately omitted delivery entry must produce the literal owner-mismatch code; the fixture's empty index is authored input rather than an expected-output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Preserves one unexecuted completed owner as the boundary twin of the unexecuted draft test; existing indexed success, missing current owners and source-digest drift remain separate cases.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_publication_denominator owns this portable in-memory materialization/inspection case and starts no filesystem publication or installed consumer.
 */
export function test_production_library_publication_denominator(): void {
  TestValidator.equals(
    "an unexecuted completed source is refused",
    inspectLibraryCompletionPublication([libraryCompletionBinding()], false),
    ["library-owner-mismatch"],
  );
}
