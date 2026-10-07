/**
 * A message a viewport iframe posts to its host page.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the message kinds and their payload.
 * @author Samchon
 */
export interface IHumanViewerFrameMessage {
  /** `human:admission` (the frame's module loaded), `human:loaded` (its worker's too), `human:ready`, `human:error` or `human:address`. */
  type?: string;

  /** Why the candidate failed, for `human:error`. */
  error?: string;

  /** For `human:error`: the candidate mixed compiles and must be started again at once. */
  restart?: boolean;

  /** The displayed address, for `human:address`. */
  address?: string;

  /** Displayed mesh names, for `human:address`. */
  parts?: string[];
}
