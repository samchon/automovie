import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import {
  createLibraryCompletionSnapshot,
  planLibraryCompletion,
} from "../internal/createLibraryCompletionSnapshot";

/**
 * An empty library closure selects no executable export and no refusal.
 *
 * Scenarios:
 * 1. Zero owner edges and zero sources return zero entries and problems,
 *    guarding the empty execution-plan boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans a snapshot with no source owners or selected sources and asserts empty entries/problems, detecting manufactured execution or refusal for an empty closure.
 * @evidence contracts/testing.md#independent-expectations Zero selected sources and zero owner edges imply no executable registration and no mismatch; the expected empty arrays are literal, not produced by another planner call.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the original empty-population boundary while completion, diagnosis and enforcement twins cover nonempty owner populations separately.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_execution_empty owns one portable in-memory snapshot case through the existing planner fixture, without filesystem acquisition, installation or host startup.
 */
export function test_production_library_execution_empty(): void {
  const empty: ReturnType<typeof createLibraryCompletionSnapshot> = {
    ...createLibraryCompletionSnapshot(libraryCompletionBinding()),
    sourceOwners: [],
    sources: [],
  };
  const result: ReturnType<typeof planLibraryCompletion> = planLibraryCompletion(empty);
  TestValidator.equals(
    "empty closure remains empty",
    { entries: result.entries, problems: result.problems },
    { entries: [], problems: [] },
  );
}
