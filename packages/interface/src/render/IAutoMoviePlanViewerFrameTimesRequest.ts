/**
 * Film-local sample selection on the encoded frame grid. planViewerFrameTimes requires exactly one nonempty explicit at list or a range with from/to and exactly one of every/step. It validates finite positive rate/duration and inclusive endpoints, sorts/deduplicates explicit values, and rounds step samples to grid frames. A valid range may contain no grid frame.
 *
 * @evidence contracts/development/design.md#principled-representation It validates finite positive rate/duration and inclusive endpoints, sorts/deduplicates explicit values, and rounds step samples to grid frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planViewerFrameTimes exchanges fps, durationSeconds, at, from, to, every, step; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A valid range may contain no grid frame.
 * @evidence contracts/development/common.md#meaningful-documentation Film-local sample selection on the encoded frame grid. planViewerFrameTimes requires exactly one nonempty explicit at list or a range with from/to and exactly one of every/step. The prose and members document how planViewerFrameTimes interprets and admits these values.
 */
export interface IAutoMoviePlanViewerFrameTimesRequest {
  /** Frames per second of the film's encoded grid. */
  fps: number;

  /** Film running time in seconds. */
  durationSeconds: number;

  /** Explicit film seconds, kept as given. */
  at?: readonly number[];

  /** Start of the range in film seconds, inclusive. */
  from?: number;

  /** End of the range in film seconds, inclusive. */
  to?: number;

  /** Range interval in whole frames. */
  every?: number;

  /** Range interval in seconds, rounded to the nearest frame per sample. */
  step?: number;
}
