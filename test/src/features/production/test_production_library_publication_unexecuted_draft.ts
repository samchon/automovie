import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An incomplete unexecuted edge creates no completed-publication obligation.
 *
 * Scenarios:
 * 1. An unexecuted draft edge beside an empty publication produces no owner
 *    mismatch, guarding the incomplete edge's denominator boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Reopens an empty publication beside one unexecuted draft owner and asserts no owner mismatch, catching a completed-publication denominator that incorrectly includes unfinished unexecuted work.
 * @evidence contracts/testing.md#independent-expectations A draft owner has no completed-realization obligation until executed, so an empty index and that draft edge yield literal no problems; this does not grant admission to a draft export already indexed.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the unexecuted draft twin of the completed-denominator refusal; indexed unfinished exports are tested by publication_incomplete and successful completed edges separately.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_publication_unexecuted_draft owns one portable memory-publication case through the existing fixture, without writing files or starting a consumer/production host.
 */
export function test_production_library_publication_unexecuted_draft(): void {
    TestValidator.equals(
      "an unexecuted draft is outside the completed denominator",
      inspectLibraryCompletionPublication(
        [libraryCompletionBinding({ stage: "draft" })],
        false,
      ),
      [],
    );
}
