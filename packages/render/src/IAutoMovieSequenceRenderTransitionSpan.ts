import { IAutoMovieTransition } from "@automovie/interface";

/**
 * Incoming transition span on the output clock.
 *
 * @evidence contracts/development/design.md#principled-representation An incoming entry identifies the outgoing and incoming shots and one transition interval on the global output clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The manifest names transition timing independently from sampled blend weights because hosts may inspect editorial spans without visiting every frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Transition kind and duration are the authored values resolved by the timeline, with no shot-name exception.
 * @evidence contracts/development/common.md#meaningful-documentation Members state incoming entry indexing, endpoints, kind and the start, end and overlap duration in seconds.
 */
export interface IAutoMovieSequenceRenderTransitionSpan {
  /**
   * Index of the incoming entry in `sequence.shots`.
   */
  entry: number;

  /**
   * Outgoing shot id.
   */
  from: string;

  /**
   * Incoming shot id.
   */
  to: string;

  /**
   * Transition style copied from the sequence entry.
   */
  kind: IAutoMovieTransition["kind"];

  /**
   * Global output second where the transition begins.
   */
  start: number;

  /**
   * Global output second where the transition ends.
   */
  end: number;

  /**
   * Transition overlap duration in seconds.
   */
  duration: number;
}
