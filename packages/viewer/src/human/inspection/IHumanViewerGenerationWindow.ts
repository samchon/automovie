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
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Dirty state and a completion promise keep one candidate's loading witness until it receives a revision label or null.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation A dirty window closes without a proven label rather than borrowing a later source revision.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationWindow {
  /**
   * A file some build reads was edited during the window.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Records that an actually reached input changed during candidate loading, preventing a proven current-source label.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Records that an actually reached input changed during candidate loading, preventing a proven current-source label.
   */
  dirty: boolean;

  /**
   * Resolves with the window's label once it is closed.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Settles with the actual loading-window revision label or null for unproven loading.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Settles with the actual loading-window revision label or null for unproven loading.
   */
  closed: Promise<string | null>;

  /**
   * Close the window with its label.
   *
   * @evidence contracts/common.md#principled-implementation The candidate's completion promise settles with its proven source label or null.
   * @evidence contracts/common.md#clear-and-simple-design One close operation completes the same loading window readers await.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A dirty or unproven window supplies null rather than a guessed current label.
   * @evidence contracts/common.md#meaningful-documentation The argument is the source label selected by the window owner, with null for unproven loading.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity The candidate's completion promise settles with its proven source label or null.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation The argument is the source label selected by the window owner, with null for unproven loading.
   */
  close: (label: string | null) => void;
}
