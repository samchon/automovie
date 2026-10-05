/**
 * What the host page's admission bridge answers: whether a viewer frame that
 * carries the human runtime could judge the document, and its owner's verdict.
 *
 * @evidence contracts/common.md#principled-implementation An unavailable bridge is a state of its own, never read as a refusal or an admission.
 * @evidence contracts/common.md#meaningful-documentation Names both members and their combinations.
 * @author Samchon
 */
export interface IHumanViewerAdmissionReply {
  /** False when no viewer frame has loaded its module yet, so nothing was judged. */
  available: boolean;

  /** Null when admitted or unavailable, else the owner's refusal reason. */
  reason: string | null;
}
