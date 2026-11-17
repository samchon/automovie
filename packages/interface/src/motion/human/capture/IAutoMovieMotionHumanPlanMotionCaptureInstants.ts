/**
 * Contracts used by planMotionCaptureInstants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: Instant to capture in performance seconds. label: Human-readable event label attached to that capture instant. seconds: Instant to capture in performance seconds.
 * @evidence contracts/development/design.md#principled-representation seconds: Instant to capture in performance seconds. label: Human-readable event label attached to that capture instant. seconds: Instant to capture in performance seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: capture/planMotionCaptureInstants.ts (planMotionCaptureInstants, times); capture/planMotionCaptureInstants.ts (planMotionCaptureInstants, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in planMotionCaptureInstants.
 */
export namespace IAutoMovieMotionHumanPlanMotionCaptureInstants {
  /**
   * The instants a motion case's capture draws, each named by the case's own label: one per second written to the millisecond, the resolution a capture names its cells at. Input times of planMotionCaptureInstants. The case's instants, each with its label.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Instant to capture in performance seconds. label: Human-readable event label attached to that capture instant.
   * @evidence contracts/development/design.md#principled-representation seconds: Instant to capture in performance seconds. label: Human-readable event label attached to that capture instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: capture/planMotionCaptureInstants.ts (planMotionCaptureInstants, times).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in planMotionCaptureInstants.
   */
  export type ITimes = readonly {
    /** Instant to capture in performance seconds. */
    seconds: number;
    /** Human-readable event label attached to that capture instant. */
    label: string;
  }[];

  /**
   * The instants a motion case's capture draws, each named by the case's own label: one per second written to the millisecond, the resolution a capture names its cells at. Result returned by planMotionCaptureInstants. The instants drawn, with their labels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Instant to capture in performance seconds. label: Human-readable event label attached to that capture instant.
   * @evidence contracts/development/design.md#principled-representation seconds: Instant to capture in performance seconds. label: Human-readable event label attached to that capture instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: capture/planMotionCaptureInstants.ts (planMotionCaptureInstants, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in planMotionCaptureInstants.
   */
  export type IResult = {
    /** Instant to capture in performance seconds. */
    seconds: number;
    /** Human-readable event label attached to that capture instant. */
    label: string;
  }[];
}
