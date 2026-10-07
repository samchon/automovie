import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply";

/**
 * The host page's standing admission bridge. It exists from the moment the
 * host module runs, independent of any committed generation, and forwards to
 * the newest viewer frame whose module has loaded.
 *
 * @evidence contracts/common.md#principled-implementation Admission does not wait for a drawable generation, so a document is never kept out of the catalogue only because the page reloaded.
 * @evidence contracts/common.md#meaningful-documentation States when the bridge exists and where it forwards.
 * @author Samchon
 */
export interface IHumanViewerAdmissionBridge {
  /** Wire generation loaded by this host; checked before asking for any verdict. */
  protocol: string;

  /** Judge one document JSON with its domain owner's admission in the newest loaded frame. */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;
}
