import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";

/**
 * The latest warm failure with when and on which revision it happened.
 *
 * @evidence contracts/common.md#principled-implementation The latest warm failure keeps its original document/reason plus failure time and pass revision.
 * @evidence contracts/common.md#clear-and-simple-design Extending the existing failure record adds chronology without duplicating failure identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resetting a pass's counters does not erase the independently retained latest failure.
 * @evidence contracts/common.md#meaningful-documentation Documents ISO failure time and the source revision associated with the preserved error.
 * @author Samchon
 */
export interface IHumanViewerWarmLastFailure extends IHumanViewerWarmFailure {
  /** ISO time of the failure. */
  at: string;

  /** The source revision the pass warmed. */
  revision: string;
}
