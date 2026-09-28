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
 * 1. Draft, disabled, and unknown stages with true review metadata produce
 *    one refusal and no executable entry.
 */
export const test_production_library_execution_incomplete = (): void => {
  for (const stage of ["draft", "disabled", "source"]) {
    const snapshot = createLibraryCompletionSnapshot(
      libraryCompletionBinding({ stage, reviewed: true }),
    );
    const refused = planLibraryCompletion(snapshot);
    TestValidator.equals(
      `incomplete ${stage} cannot borrow review metadata`,
      { entries: refused.entries, problems: refused.problems.length },
      { entries: [], problems: 1 },
    );
  }
};
