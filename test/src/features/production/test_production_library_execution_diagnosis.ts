import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import {
  createLibraryCompletionSnapshot,
  planLibraryCompletion,
} from "../internal/createLibraryCompletionSnapshot";

/**
 * Source-scope diagnosis relaxes completion while retaining enforcement.
 *
 * Scenarios:
 * 1. Disabling the completion gate admits an enforced draft edge, while its
 *    adjacent unenforced twin remains refused with no executable entry.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans the enforced and unenforced draft snapshots with completion disabled, asserting exact entry/problem counts so diagnosis cannot accidentally remove enforcement or retain the completion gate.
 * @evidence contracts/testing.md#independent-expectations The documented source-scope rule requires enforcement but permits draft completion, giving literal counts [1,0,0,1]; synthetic fixture digests establish routing identity rather than actual source-byte provenance.
 * @evidence contracts/testing.md#distinguishing-cases Changes only enforcement between two draft owners under the same false completion flag; completed admission, default incomplete refusal and empty populations remain adjacent execution cases.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_execution_diagnosis owns both portable resident-snapshot cases through the existing planner fixture; it installs no consumer and starts no source host.
 */
export function test_production_library_execution_diagnosis(): void {
  const draft: ReturnType<typeof createLibraryCompletionSnapshot> = createLibraryCompletionSnapshot(
    libraryCompletionBinding({ stage: "draft" }),
  );
  const unenforced: ReturnType<typeof createLibraryCompletionSnapshot> = createLibraryCompletionSnapshot(
    libraryCompletionBinding({ stage: "draft", enforced: false }),
  );
  const accepted: ReturnType<typeof planLibraryCompletion> = planLibraryCompletion(draft, false);
  const refused: ReturnType<typeof planLibraryCompletion> = planLibraryCompletion(unenforced, false);
  TestValidator.equals(
    "diagnosis admits only an enforced draft",
    [
      accepted.entries.length,
      accepted.problems.length,
      refused.entries.length,
      refused.problems.length,
    ],
    [1, 0, 0, 1],
  );
}
