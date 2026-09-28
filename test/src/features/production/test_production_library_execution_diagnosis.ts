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
 */
export const test_production_library_execution_diagnosis = (): void => {
  const draft = createLibraryCompletionSnapshot(
    libraryCompletionBinding({ stage: "draft" }),
  );
  const unenforced = createLibraryCompletionSnapshot(
    libraryCompletionBinding({ stage: "draft", enforced: false }),
  );
  const accepted = planLibraryCompletion(draft, false);
  const refused = planLibraryCompletion(unenforced, false);
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
};
