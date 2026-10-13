import type { createHumanViewerCompileGate } from "./createHumanViewerCompileGate.js";

/**
 * What the generation windows read and hold.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation A compile hold, current revision and edit-batch state provide the facts used to label a loaded generation.
 * @evidence contracts/common.md#clear-and-simple-design Window management receives the existing gate instead of implementing a second compiler lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closing publication depends on actual source and updating state, not on a loading timeout.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerGenerationWindowsProps {
  /** The compile gate a window holds. */
  gate: ReturnType<typeof createHumanViewerCompileGate>;

  /**
   * The current source revision.
   *
   * @evidence contracts/common.md#principled-implementation The revision accessor supplies the current source identity when a candidate window is labelled.
   * @evidence contracts/common.md#clear-and-simple-design The label owner reads revision authority rather than computing another digest.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A candidate cannot borrow a revision stored before its load completed.
   * @evidence contracts/common.md#meaningful-documentation The string identifies source current at the window owner's check.
   */
  revision: () => string;

  /**
   * Whether an edit batch is still being digested.
   *
   * @evidence contracts/common.md#principled-implementation The accessor reports whether source edits are still being digested at window closure.
   * @evidence contracts/common.md#clear-and-simple-design Edit processing remains with its existing source owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A loading window cannot be labelled current while an edit batch is unresolved.
   * @evidence contracts/common.md#meaningful-documentation True means the source batch is unfinished and blocks a proven current label.
   */
  updating: () => boolean;

  /**
   * Told after a window closed, so documents waiting on its frame are asked again.
   *
   * @evidence contracts/common.md#principled-implementation The host is notified after a window closes and releases its compile hold.
   * @evidence contracts/common.md#clear-and-simple-design Admission retries remain host-triggered instead of becoming a window polling loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No retry is manufactured merely because loading time elapsed.
   * @evidence contracts/common.md#meaningful-documentation The notification follows physical module-window completion and prompts pending admission reconsideration.
   */
  closed: () => void;
}
