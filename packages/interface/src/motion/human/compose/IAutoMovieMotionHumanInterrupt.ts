/**
 * Cancel rows by name: when an action may be cancelled, as a window of its
 * phrase, and how fast the next action blends in.
 *
 * A cancel table's row is a window, a kind, an entry share and a blend. Most
 * rows are one of four windows (any time, or from one of the phrase's instants
 * to the end) and one of three blends, entered at the next action's start by
 * inertialization. This owner names both, so a table reads as `guard:
 * ["fromStroke", "smooth"]`.
 */
export namespace IAutoMovieMotionHumanInterrupt {
  /**
   * When an action may be cancelled: at any time, or from a phrase instant to
   * the end.
   */
  export type Window = (readonly [
    "anytime",
    "fromStroke",
    "fromStrokeEnd",
    "fromRelax",
  ])[number];

  /** How fast the next action blends in. */
  export type Blend = (readonly [
    "reflex",
    "quick",
    "smooth",
    "deliberate",
  ])[number];
}
