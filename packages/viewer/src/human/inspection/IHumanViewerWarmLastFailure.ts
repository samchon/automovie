import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";

/**
 * The latest warm failure with when and on which revision it happened.
 *
 * @author Samchon
 */
export interface IHumanViewerWarmLastFailure extends IHumanViewerWarmFailure {
  /** ISO time of the failure. */
  at: string;

  /** The source revision the pass warmed. */
  revision: string;
}
