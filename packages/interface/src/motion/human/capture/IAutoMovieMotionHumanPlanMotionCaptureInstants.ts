/** Contracts used by planMotionCaptureInstants. */
export namespace IAutoMovieMotionHumanPlanMotionCaptureInstants {
  /**
   * The instants a motion case's capture draws, each named by the case's own
   * label: one per second written to the millisecond, the resolution a capture
   * names its cells at. Input times of planMotionCaptureInstants. The case's
   * instants, each with its label.
   */
  export type ITimes = readonly {
    /** Instant to capture in performance seconds. */
    seconds: number;
    /** Human-readable event label attached to that capture instant. */
    label: string;
  }[];

  /**
   * The instants a motion case's capture draws, each named by the case's own
   * label: one per second written to the millisecond, the resolution a capture
   * names its cells at. Result returned by planMotionCaptureInstants. The
   * instants drawn, with their labels.
   */
  export type IResult = {
    /** Instant to capture in performance seconds. */
    seconds: number;
    /** Human-readable event label attached to that capture instant. */
    label: string;
  }[];
}
