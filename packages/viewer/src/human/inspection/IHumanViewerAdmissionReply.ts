/**
 * What the host page's admission bridge answers: whether a viewer frame that carries the human runtime could judge the document, and its owner's verdict.
 *
 * @evidence contracts/common.md#principled-implementation Carries bridge availability, actual owner refusal/null admission and the selected frame's optional generation token.
 * @evidence contracts/common.md#clear-and-simple-design Separates transport readiness from numerical verdict without turning unavailable frames into errors for the catalogue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable replies establish no judgment; token presence is not proof of current code, and the server checks window/source authority separately.
 * @evidence contracts/common.md#meaningful-documentation Defines false availability, null reason and token absence for unavailable or tokenless frames; malformed envelopes remain refusals at the bridge.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reply record adds fixed fields; document parsing/admission and frame selection remain with the actual bridge/domain owner.
 * @evidence contracts/performance.md#reuse-equivalent-work A reply belongs to one selected frame/request; createHumanViewerAdmission also requires its document key to still be current before storage.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No model or native handle is returned; the caller owns the reply until verdict processing and host windows own generation-token lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionReply {
  /**
   * False when the newest present frame lacks a compatible loaded admission hook; an older loaded frame is not used, and nothing was judged.
   */
  available: boolean;

  /** Null when admitted or unavailable, else the owner's refusal reason. */
  reason: string | null;

  /**
   * The generation token of the frame that judged it, null when unavailable or opened without one.
   */
  token: string | null;
}
