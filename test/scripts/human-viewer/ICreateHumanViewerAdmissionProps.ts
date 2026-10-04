/**
 * How the server reaches the page's document admission and whom it tells
 * when a verdict arrives.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies page access and catalogue republication; the owner keeps only verdicts.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface ICreateHumanViewerAdmissionProps {
  /** Whether a page generation is ready to admit documents. */
  ready: () => boolean;

  /** Asks the page to admit one document JSON; resolves to null or the owner's reason. */
  admit: (domain: string, text: string) => Promise<string | null>;

  /** Called after a verdict was stored, so the host republishes its catalogue. */
  changed: () => void;
}
