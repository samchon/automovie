import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import {
  createLibraryCompletionSnapshot,
  planLibraryCompletion,
} from "../internal/createLibraryCompletionSnapshot";

/**
 * An unenforced completed owner cannot execute.
 *
 * Scenarios:
 * 1. An unenforced evidence or compatible review edge with an exact source
 *    identity produces one refusal and no executable entry.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans executions for completed stages with enforcement false and asserts no executable entries and one refusal, catching completion that ignores graph enforcement.
 * @evidence contracts/testing.md#independent-expectations The execution contract requires an enforced graph edge as well as a completed stage; literal zero entries and one refusal test that conjunction without proving refusal wording.
 * @evidence contracts/testing.md#distinguishing-cases Evidence and compatible review stages both refuse the same unenforced edge; adjacent tests own enforced completed admission and incomplete-stage refusal.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns both resident-snapshot loop cases through the existing source-module fixture, without installation or a production host.
 */
export function test_production_library_execution_unenforced(): void {
  for (const stage of ["evidence", "review"]) {
    const snapshot: ReturnType<typeof createLibraryCompletionSnapshot> = createLibraryCompletionSnapshot(
      libraryCompletionBinding({ stage, enforced: false, }),
    );
    const refused: { entries: readonly (Pick<IAutoMovieProductionEvidenceSourceOwnerBinding, "branch" | "sourcePath" | "exportName" | "sourceDigest"> & { owner: string; })[]; sources: readonly { path: string; digest: string | null; }[]; problems: readonly string[]; } = planLibraryCompletion(snapshot);
    TestValidator.equals(
      `unenforced ${stage} is refused`,
      { entries: refused.entries, problems: refused.problems.length },
      { entries: [], problems: 1 },
    );
  }
}
