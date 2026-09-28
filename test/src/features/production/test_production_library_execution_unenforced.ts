import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import {
  createLibraryCompletionSnapshot,
  planLibraryCompletion,
} from "../internal/createLibraryCompletionSnapshot";

/**
 * An unenforced owner cannot execute even with review metadata.
 *
 * Scenarios:
 * 1. An unenforced evidence or compatible review edge with true review
 *    metadata produces one refusal and no executable entry.
 */
export const test_production_library_execution_unenforced = (): void => {
  for (const stage of ["evidence", "review"]) {
    const snapshot = createLibraryCompletionSnapshot(
      libraryCompletionBinding({ stage, enforced: false, reviewed: true }),
    );
    const refused = planLibraryCompletion(snapshot);
    TestValidator.equals(
      `unenforced ${stage} is refused`,
      { entries: refused.entries, problems: refused.problems.length },
      { entries: [], problems: 1 },
    );
  }
};
