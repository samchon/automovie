import { TestValidator } from "@nestia/e2e";

import { inspectLibraryCompletionPublication } from "../internal/inspectLibraryCompletionPublication";

/**
 * An indexed export with no owner edge is refused.
 *
 * Scenarios:
 * 1. An empty current owner population refuses one indexed delivery export,
 *    guarding exact owner presence at publication reopening.
 *
 * @evidence contracts/testing.md#behavioral-verification Reopens the indexed delivery with an empty current source-owner population and requires library-owner-mismatch, detecting an export authenticated only by its prior index.
 * @evidence contracts/testing.md#independent-expectations The publication contract requires the exact current owner edge; an explicitly empty edge array cannot satisfy it, giving the literal refusal code independently of index metadata.
 * @evidence contracts/testing.md#distinguishing-cases Preserves missing current-owner presence against one indexed export; empty execution, omitted completed exports and incomplete or unenforced current edges have their own adjacent tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_publication_missing_owner owns this portable in-memory publication inspection without consumer installation, filesystem I/O or a real source execution host.
 */
export function test_production_library_publication_missing_owner(): void {
  TestValidator.equals(
    "publication requires its exact current owner edge",
    inspectLibraryCompletionPublication([]),
    ["library-owner-mismatch"],
  );
}
