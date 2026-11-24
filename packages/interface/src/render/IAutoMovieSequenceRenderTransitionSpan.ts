import type { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition.js";

/** Incoming transition span on the output clock. */
export interface IAutoMovieSequenceRenderTransitionSpan {
  /** Index of the incoming entry in `sequence.shots`. */
  entry: number;

  /** Outgoing shot id. */
  from: string;

  /** Incoming shot id. */
  to: string;

  /**
   * Transition style copied from the sequence entry: `crossDissolve` mixes the
   * two shots across the span, and `fade` dips through black, black at the
   * span's midpoint `start + duration / 2`.
   */
  kind: IAutoMovieTransition["kind"];

  /** Inclusive global output second where the transition begins. */
  start: number;

  /** Exclusive global output second where the transition finishes. */
  end: number;

  /** Transition overlap duration in seconds. */
  duration: number;
}
