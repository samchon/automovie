import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import {
  createLibraryCompletionSnapshot,
  planLibraryCompletion,
} from "../internal/createLibraryCompletionSnapshot";

/**
 * An incomplete source owner refuses the whole execution plan.
 *
 * Scenarios:
 * 1. Draft, disabled, and unknown stages on exact enforced owner edges produce
 *    one refusal and no executable entry.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans library execution for draft, disabled and unknown owner stages and asserts no entries plus exactly one refusal, catching admission of unfinished sources.
 * @evidence contracts/testing.md#independent-expectations The completion contract excludes these three stages regardless of an exact enforced owner identity; empty entries and one refusal are literal expectations, without a diagnostic-message oracle.
 * @evidence contracts/testing.md#distinguishing-cases Each disallowed stage retains the same exact source binding; allowed evidence and review stages and unenforced completed edges are owned by adjacent execution tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns its three loop cases over resident snapshots and the existing source-module fixture; no generated consumer or real production host is started.
 */
export function test_production_library_execution_incomplete(): void {
  for (const stage of ["draft", "disabled", "source"]) {
    const snapshot: ReturnType<typeof createLibraryCompletionSnapshot> = createLibraryCompletionSnapshot(
      libraryCompletionBinding({ stage, }),
    );
    const refused: { entries: readonly (Pick<IAutoMovieProductionEvidenceSourceOwnerBinding, "branch" | "sourcePath" | "exportName" | "sourceDigest"> & { owner: string; })[]; sources: readonly { path: string; digest: string | null; }[]; problems: readonly string[]; } = planLibraryCompletion(snapshot);
    TestValidator.equals(
      `incomplete ${stage} cannot borrow review metadata`,
      { entries: refused.entries, problems: refused.problems.length },
      { entries: [], problems: 1 },
    );
  }
}
