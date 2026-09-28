import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import {
  createLibraryCompletionSnapshot,
  planLibraryCompletion,
} from "../internal/createLibraryCompletionSnapshot";

/**
 * Completed library owners execute without a companion review row.
 *
 * Scenarios:
 * 1. Evidence and compatible review stages pass the default and explicit
 *    completion gates with false review metadata and no plan problem.
 */
export const test_production_library_execution_completion = (): void => {
  for (const stage of ["evidence", "review"]) {
    const binding = libraryCompletionBinding({ stage });
    const snapshot = createLibraryCompletionSnapshot(binding);
    const expected = [
      {
        branch: binding.branch,
        sourcePath: binding.sourcePath,
        exportName: binding.exportName,
        owner: "docs/settings/delivery.md#delivery",
        sourceDigest: binding.sourceDigest,
        reviewed: false,
      },
    ];
    const ordinary = planLibraryCompletion(snapshot);
    const explicit = planLibraryCompletion(snapshot, true);
    TestValidator.equals(
      `completed ${stage} executes without review metadata`,
      [
        ordinary.entries,
        ordinary.problems,
        explicit.entries,
        explicit.problems,
      ],
      [expected, [], expected, []],
    );
  }
};
