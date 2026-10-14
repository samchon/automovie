import { TestValidator } from "@nestia/e2e";

import { libraryCompletionBinding } from "../internal/createLibraryCompletionEvidence";
import { inspectSourceOwnerCompletion } from "../internal/inspectSourceOwnerCompletion";

/**
 * Enforced evidence and the compatible review stage complete an exact source owner.
 *
 * Scenarios:
 *
 * 1. Evidence and compatible review edges admit execution and resolve the same exact identity during source diagnosis.
 *
 * The former optional reviewed flag is absent from the maintained binding contract. Its two values no longer form an input dimension; the two declared stages remain the meaningful completion neighbors.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the actual completion predicate and source-owner resolver through the existing inspector, requiring completion, execution admission and exact diagnostic resolution for each enforced completed stage.
 * @evidence contracts/testing.md#independent-expectations The literal three true results follow the conjunction of enforcement and the two supported completed stages; supplied fixture digests test identity matching rather than independently hashing source bytes.
 * @evidence contracts/testing.md#distinguishing-cases Evidence and compatible review are the two admitted stage neighbors. Adjacent incomplete and unenforced tests retain their refusal cases; the deleted reviewed metadata field cannot be supplied as an additional completion authority.
 * @evidence contracts/testing.md#execution-ownership The discoverable file-named synchronous unit owns both stage cases through existing resident binding and inspector fixtures, without a generated consumer, process, filesystem or new runtime host.
 */
export function test_production_source_owner_completion(): void {
  for (const stage of ["evidence", "review"])
    TestValidator.equals(
      `completed ${stage} admits execution`,
      inspectSourceOwnerCompletion(libraryCompletionBinding({ stage })),
      { complete: true, admission: true, sourceDiagnosis: true },
    );
}
