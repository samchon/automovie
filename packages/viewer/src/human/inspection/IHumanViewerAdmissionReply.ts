/**
 * What the host page's admission bridge answers: whether a viewer frame that
 * carries the human runtime could judge the document, and its owner's verdict.
 *
 * @evidence contracts/common.md#principled-implementation An unavailable bridge is a state of its own, never read as a refusal or an admission.
 * @evidence contracts/common.md#meaningful-documentation Names both members and their combinations.
 *
 * @evidence contracts/common.md#clear-and-simple-design Availability, nullable refusal reason and judging-frame token contain the complete bridge outcome.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable frame cannot produce a current-generation token or be treated as an admitted document.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority An unavailable bridge is a state of its own, never read as a refusal or an admission.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant An unavailable frame cannot produce a current-generation token or be treated as an admitted document.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionReply {
  /**
   * False when no viewer frame has loaded its module yet, so nothing was judged.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Separates a loaded judging frame from a bridge with no available numerical owner.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Separates a loaded judging frame from a bridge with no available numerical owner.
   */
  available: boolean;

  /**
   * Null when admitted or unavailable, else the owner's refusal reason.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Retains the original domain refusal while null is distinguished by the available flag.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Retains the original domain refusal while null is distinguished by the available flag.
   */
  reason: string | null;

  /**
   * The generation token of the frame that judged it, null when unavailable or opened without one.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Binds a returned verdict to the actual judging frame, remaining null for an unavailable or unlabelled frame.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Binds a returned verdict to the actual judging frame, remaining null for an unavailable or unlabelled frame.
   */
  token: string | null;
}
