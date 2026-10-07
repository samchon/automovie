import type { IHumanViewerAdmissionReply } from "./IHumanViewerAdmissionReply";
import type { IHumanViewerPageState } from "./IHumanViewerPageState";

/**
 * How the server reaches the page's document admission and whom it tells
 * when a verdict arrives.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies page access and catalogue republication; the owner keeps only verdicts.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface ICreateHumanViewerAdmissionProps {
  /** Whether the page can admit documents now, will be able to, or never can. */
  page: () => IHumanViewerPageState;

  /** Asks the page's admission bridge to judge one document JSON. */
  admit: (
    domain: string,
    text: string,
    basis: string,
  ) => Promise<IHumanViewerAdmissionReply>;

  /** Called after a verdict or a waiting reason was stored, so the host republishes its catalogue. */
  changed: () => void;
}
