import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
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
 *    completion gates with exact enforced owner edges and no plan problem.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans exact library owner executions for evidence and compatible review stages; a wrong completion predicate removes entries or creates refusal problems.
 * @evidence contracts/testing.md#independent-expectations The declared completion stages and literal delivery target define the expected entry and empty problems; copied source identity fields limit this to routing rather than independent byte-digest validation.
 * @evidence contracts/testing.md#distinguishing-cases Default and explicitly completed planning agree for both allowed stages; incomplete and unenforced edge refusals are owned by the adjacent execution tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns both loop cases and evaluates resident typed snapshots through the existing source-module fixture; it starts no production host or installed consumer.
 */
export function test_production_library_execution_completion(): void {
  for (const stage of ["evidence", "review"]) {
    const binding: IAutoMovieProductionEvidenceSourceOwnerBinding = libraryCompletionBinding({ stage });
    const snapshot: ReturnType<typeof createLibraryCompletionSnapshot> = createLibraryCompletionSnapshot(binding);
    const expected: { branch: string; sourcePath: string; exportName: string; owner: string; sourceDigest: string; }[] = [
      {
        branch: binding.branch,
        sourcePath: binding.sourcePath,
        exportName: binding.exportName,
        owner: "docs/settings/delivery.md#delivery",
        sourceDigest: binding.sourceDigest,
      },
    ];
    const ordinary: { entries: readonly (Pick<IAutoMovieProductionEvidenceSourceOwnerBinding, "branch" | "sourcePath" | "exportName" | "sourceDigest"> & { owner: string; })[]; sources: readonly { path: string; digest: string | null; }[]; problems: readonly string[]; } = planLibraryCompletion(snapshot);
    const explicit: { entries: readonly (Pick<IAutoMovieProductionEvidenceSourceOwnerBinding, "branch" | "sourcePath" | "exportName" | "sourceDigest"> & { owner: string; })[]; sources: readonly { path: string; digest: string | null; }[]; problems: readonly string[]; } = planLibraryCompletion(snapshot, true);
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
}
