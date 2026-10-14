import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectSourceOwnerCompletion } from "../internal/inspectSourceOwnerCompletion";

/**
 * Incomplete stages resolve exact identity without admitting execution.
 *
 * Scenarios:
 *
 * 1. Draft, disabled, and unknown stages refuse execution admission while
 *    exact source diagnosis still resolves those same enforced identities.
 *
 * @evidence contracts/testing.md#behavioral-verification Compares owner completion, execution admission and exact source diagnosis for unfinished stages, catching a diagnostic match being mistaken for permission to execute.
 * @evidence contracts/testing.md#independent-expectations Literal false completion and admission with true source diagnosis derive from the distinction between identity resolution and completed execution; they do not prove digest computation.
 * @evidence contracts/testing.md#distinguishing-cases Draft, disabled and unknown stages keep their enforced exact identity while remaining incomplete; adjacent tests own completed unenforced edges and exact-binding ambiguity.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns three resident-binding loop cases through the shared completion inspector and starts no consumer or production host.
 */
export function test_production_source_owner_incomplete_admission(): void {
  for (const stage of ["draft", "disabled", "source"])
    TestValidator.equals(
      `incomplete ${stage} remains outside execution`,
      inspectSourceOwnerCompletion(
        libraryCompletionBinding({ stage, }),
      ),
      { complete: false, admission: false, sourceDiagnosis: true },
    );
}
