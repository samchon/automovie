/**
 * One candidate's loading window: from the hold it opened until it released
 * it after its page and worker modules loaded.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerGenerationWindow {
  /** A file some build reads was edited during the window. */
  dirty: boolean;

  /** Resolves with the window's label once it is closed. */
  closed: Promise<string | null>;

  /** Close the window with its label. */
  close: (label: string | null) => void;
}
