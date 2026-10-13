/**
 * One source-aware document verdict awaited from the resident numerical worker.
 * It carries no model and creates no numerical cache entry.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the owner's verdict and infrastructure refusal boundaries.
 *
 * @evidence contracts/common.md#principled-implementation Separate promise callbacks preserve owner verdicts and inability to obtain a verdict as distinct request outcomes.
 * @evidence contracts/common.md#clear-and-simple-design Only success settlement and transport failure settlement are retained for one awaited admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No numerical model or cache fallback can enter this document-only request record.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Separate promise callbacks preserve owner verdicts and inability to obtain a verdict as distinct request outcomes.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant No numerical model or cache fallback can enter this document-only request record.
 *
 * @author Samchon
 */
export interface IHumanViewerPendingAdmission {
  /**
   * Null is admitted; a string is the domain owner's original refusal.
   *
   * @evidence contracts/common.md#principled-implementation The waiting document-only request settles with its owner's original admission reason.
   * @evidence contracts/common.md#clear-and-simple-design The pending record retains only the promise completion boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful document admission cannot create a model or a numerical cache entry here.
   * @evidence contracts/common.md#meaningful-documentation Null is owner-admitted; a string is the original domain refusal.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority The waiting document-only request settles with its owner's original admission reason.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Null is owner-admitted; a string is the original domain refusal.
   */
  resolve: (reason: string | null) => void;

  /**
   * Source or worker transport could not supply a verdict.
   *
   * @evidence contracts/common.md#principled-implementation Infrastructure failure rejects a request that could not obtain a domain verdict.
   * @evidence contracts/common.md#clear-and-simple-design Transport failure remains separate from the resolve callback's owner judgement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No rejected promise is converted into an admitted or refused numerical document.
   * @evidence contracts/common.md#meaningful-documentation The Error preserves source or worker transport failure for the awaiting caller.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Infrastructure failure rejects a request that could not obtain a domain verdict.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The Error preserves source or worker transport failure for the awaiting caller.
   */
  reject: (error: Error) => void;
}
