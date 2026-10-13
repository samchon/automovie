/**
 * Application-owned validated input transfer. The original editor/transaction
 * implements restoration; a host never guesses fields or replays DOM events.
 * Initial completion and restoration failures refuse a source candidate while
 * the prior page remains retained. The page bridge owns viewport transfer,
 * clock suspension and display resources; the application owns its document
 * transaction and restoration effects.
 *
 * @evidence contracts/common.md#principled-implementation Actual application completion and typed loader ownership precede publication.
 * @evidence contracts/common.md#clear-and-simple-design One capability describes existing application state without copying its evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Separates empty editors from completed subject frames and performs no widget replay.
 * @evidence contracts/common.md#meaningful-documentation Defines input transfer and actual view reflection responsibilities.
 * @evidence requirements/product/prototype-quality.md#product-authored-variation-determinism Carries the original application's serializable authored choices and validated restoration capability across a source candidate.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-deterministic-input-identity Defines capture and restoration of the application-owned declaration component; completion, viewport transfer and source-byte identity retain their own owners.
 * @author Samchon
 */
export interface IPlaygroundViewerApplication {
  /** Initial application transaction completion; a rejection refuses admission. */
  ready: Promise<void>;

  /**
   * Serializable actual displayed input; undefined means none was exposed.
   *
   * @evidence contracts/common.md#principled-implementation Captures the application's actual displayed authored values through their existing owner; qualification facts remain distinct from those values.
   * @evidence contracts/common.md#clear-and-simple-design One capture capability supplies transfer data while viewport state and display resources stay with the page bridge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither the host nor this capability substitutes guessed widget values or an expected model for actual application state.
   * @evidence contracts/common.md#meaningful-documentation Defines serializable displayed input and the absent-capture meaning of undefined without claiming numerical or clinical qualification.
   */
  capture: () => unknown;

  /**
   * Restore through the original validated transaction or reject the candidate.
   * Candidate mutation and rollback remain with that application's transaction;
   * rejection leaves the retained prior page available to the host.
   *
   * @evidence contracts/common.md#principled-implementation The original loader parses and restores transferred input, and its rejection prevents the candidate from replacing the prior completed page.
   * @evidence contracts/common.md#clear-and-simple-design Restoration reuses the application's transaction rather than introducing another evaluator or document store in the host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No DOM event replay or silent parameter repair turns a failed load into successful candidate admission.
   * @evidence contracts/common.md#meaningful-documentation States asynchronous refusal and distinguishes application-owned candidate rollback from host retention of the prior page.
   */
  restore: (state: unknown) => Promise<void>;

  /** An intentionally empty input editor may be shown without a subject bitmap. */
  empty?: boolean;

  /**
   * Reflect restored actual view in application-owned controls, without events.
   * Omission means this application exposes no separate view-reflection step.
   *
   * @evidence contracts/common.md#principled-implementation Control state follows the producer-restored viewport so displayed toggles agree with actual view rather than driving another numerical edit.
   * @evidence contracts/common.md#clear-and-simple-design An optional reflection capability keeps widget ownership in the original application while the page owns viewport restoration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reflection updates owned controls directly and cannot simulate input events, infer a new document or declare a rendered frame complete.
   * @evidence contracts/common.md#meaningful-documentation Names display-only reflection, application control ownership and the absence meaning of an omitted callback.
   */
  reflectView?: (state: unknown) => void;
}
