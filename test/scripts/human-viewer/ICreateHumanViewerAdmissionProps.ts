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

  /** Asks the page to admit one document JSON; resolves to null or the owner's reason. */
  admit: (domain: string, text: string) => Promise<string | null>;

  /** Called after a verdict was stored, so the host republishes its catalogue. */
  changed: () => void;
}
