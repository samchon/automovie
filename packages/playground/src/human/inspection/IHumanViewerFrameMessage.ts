/**
 * A message a viewport iframe posts to its host page.
 *
 * @evidence contracts/common.md#principled-implementation Optional payloads distinguish module admission, worker loading, completed display, source failure and failed selected-document restoration.
 * @evidence contracts/common.md#clear-and-simple-design One transport shape carries frame observations while the receiving host owns candidate acceptance and committed state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An address or part list is reported data, not manufactured GPU readiness; restart denotes an actual mixed-compile refusal rather than elapsed waiting.
 * @evidence contracts/common.md#meaningful-documentation Names each message kind, optional payload, restore-only failure and completed address/mesh meaning.
 * @author Samchon
 */
export interface IHumanViewerFrameMessage {
  /** `human:admission` (the frame's module loaded), `human:loaded` (its worker's too), `human:ready`, `human:error` or `human:address`. */
  type?: string;

  /** Why the candidate failed, for `human:error`. */
  error?: string;

  /** A failed selected-document restore; the checked generation itself remains ready. */
  restoreError?: string;

  /** For `human:error`: the candidate mixed compiles and must be started again at once. */
  restart?: boolean;

  /** The completed displayed address, for `human:address` or `human:ready`. */
  address?: string;

  /** Displayed mesh names, for `human:address` or `human:ready`. */
  parts?: string[];
}
