import { IAutoMovieTransition } from "@automovie/interface";

/**
 * Incoming transition span on the output clock.
 *
 * @evidence contracts/common.md#principled-implementation An incoming entry identifies the outgoing and incoming shots and one transition interval on the global output clock.
 * @evidence contracts/common.md#clear-and-simple-design The manifest names transition timing independently from sampled blend weights because hosts may inspect editorial spans without visiting every frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transition kind and duration are the authored values resolved by the timeline, with no shot-name exception.
 * @evidence contracts/common.md#meaningful-documentation Members state incoming entry indexing, endpoints, kind and the start, end and overlap duration in seconds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The transition interval shape declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The editorial transition metadata describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased transition interval opens no capture handle; planSequenceRender creates span scalars retained with the result caller's editorial manifest.
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
