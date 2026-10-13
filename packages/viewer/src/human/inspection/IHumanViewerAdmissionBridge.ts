import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply.js";

/**
 * The host page's standing admission bridge. It exists from the moment the
 * host module runs, independent of any committed generation, and forwards to
 * the newest viewer frame whose module has loaded.
 *
 * @evidence contracts/common.md#principled-implementation Admission does not wait for a drawable generation, so a document is never kept out of the catalogue only because the page reloaded.
 * @evidence contracts/common.md#meaningful-documentation States when the bridge exists and where it forwards.
 *
 * @evidence contracts/common.md#clear-and-simple-design One standing host bridge forwards admission into the newest loaded frame independently of drawable geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The protocol version is observed from the loaded host, and document judgement remains with its domain owner.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionBridge {
  /**
   * Wire generation loaded by this host; checked before asking for any verdict.
   */
  protocol: string;

  /**
   * Judge one document JSON with its domain owner's admission in the newest loaded frame.
   *
   * @evidence contracts/common.md#principled-implementation The standing bridge asks the newest loaded frame's domain owner to judge the exact JSON and basis.
   * @evidence contracts/common.md#clear-and-simple-design One callback forwards original inputs and returns the bridge envelope.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable frame remains unavailable instead of supplying a viewer-local schema verdict.
   * @evidence contracts/common.md#meaningful-documentation The promise reports availability, original refusal reason and judging-frame token.
   */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;
}
