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
 */
export const test_production_library_execution_empty = (): void => {
  const empty = {
    ...createLibraryCompletionSnapshot(libraryCompletionBinding()),
    sourceOwners: [],
    sources: [],
  };
  const result = planLibraryCompletion(empty);
  TestValidator.equals(
    "empty closure remains empty",
    { entries: result.entries, problems: result.problems },
    { entries: [], problems: [] },
  );
};
