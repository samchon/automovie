/**
 * What the host page's admission bridge answers: whether a viewer frame that
 * carries the human runtime could judge the document, and its owner's verdict.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionReply {
  /**
   * False when no viewer frame has loaded its module yet, so nothing was judged.
   */
  available: boolean;

  /** Null when admitted or unavailable, else the owner's refusal reason. */
  reason: string | null;

  /**
   * The generation token of the frame that judged it, null when unavailable or opened without one.
   */
  token: string | null;
}
