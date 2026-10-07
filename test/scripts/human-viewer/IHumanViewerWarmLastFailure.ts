import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure";

/**
 * The latest warm failure with when and on which revision it happened.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the added members.
 * @author Samchon
 */
export interface IHumanViewerWarmLastFailure extends IHumanViewerWarmFailure {
  /** ISO time of the failure. */
  at: string;

  /** The source revision the pass warmed. */
  revision: string;
}
