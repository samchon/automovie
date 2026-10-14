import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectSourceOwnerCompletion } from "../internal/inspectSourceOwnerCompletion";

/**
 * A completed stage without an enforced graph edge cannot admit execution.
 *
 * Scenarios:
 *
 * 1. Evidence and compatible review declarations refuse an unenforced edge
 *    while diagnostic resolution preserves its exact identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Compares completion, admission and diagnostic identity for unenforced completed stages, catching admission through an edge the graph did not enforce.
 * @evidence contracts/testing.md#independent-expectations Literal false completion and admission with true source diagnosis follow the separate enforcement and identity predicates; the oracle does not independently compute source digests.
 * @evidence contracts/testing.md#distinguishing-cases Evidence and compatible review stages both retain diagnostic identity while refusing execution; unfinished stages and ambiguous or stale bindings belong to adjacent tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns both resident-binding loop cases through the shared inspector without installing or starting a production host.
 */
export function test_production_source_owner_unenforced_admission(): void {
  for (const stage of ["evidence", "review"])
    TestValidator.equals(
      `unenforced ${stage} cannot complete`,
      inspectSourceOwnerCompletion(
        libraryCompletionBinding({ stage, enforced: false, }),
      ),
      { complete: false, admission: false, sourceDiagnosis: true },
    );
}
