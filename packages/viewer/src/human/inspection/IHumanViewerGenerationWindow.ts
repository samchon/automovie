/**
 * One candidate's loading window: from the hold it opened until it released
 * it after its page and worker modules loaded.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Dirty state and a completion promise keep one candidate's loading witness until it receives a revision label or null.
 * @evidence contracts/common.md#clear-and-simple-design One close operation settles the same promise that label readers await.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A dirty window closes without a proven label rather than borrowing a later source revision.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationWindow {
  /** A file some build reads was edited during the window. */
  dirty: boolean;

  /** Resolves with the window's label once it is closed. */
  closed: Promise<string | null>;

  /**
   * Close the window with its label.
   *
   * @evidence contracts/common.md#principled-implementation The candidate's completion promise settles with its proven source label or null.
   * @evidence contracts/common.md#clear-and-simple-design One close operation completes the same loading window readers await.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A dirty or unproven window supplies null rather than a guessed current label.
   * @evidence contracts/common.md#meaningful-documentation The argument is the source label selected by the window owner, with null for unproven loading.
   */
  close: (label: string | null) => void;
}
