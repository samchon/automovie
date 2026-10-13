import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply.js";
import type { IHumanViewerPageState } from "./IHumanViewerPageState.js";

/**
 * How the server reaches the page's document admission and whom it tells
 * when a verdict arrives.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerAdmissionProps {
  /**
   * Whether the page can admit documents now, will be able to, or never can.
   */
  page: () => IHumanViewerPageState;

  /** Asks the page's admission bridge to judge one document JSON. */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;

  /**
   * Called after a verdict or a waiting reason was stored, so the host republishes its catalogue.
   */
  changed: () => void;
}
