/**
 * Cancel rows by name: when an action may be cancelled, as a window of its
 * phrase, and how fast the next action blends in.
 *
 * A cancel table's row is a window, a kind, an entry share and a blend. Most
 * rows are one of four windows (any time, or from one of the phrase's
 * instants to the end) and one of three blends, entered at the next action's
 * start by inertialization. This owner names both, so a table reads as
 * `guard: ["fromStroke", "smooth"]`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cancel rows by name: when an action may be cancelled, as a window of its phrase, and how fast the next action blends in.
 * @evidence contracts/development/design.md#principled-representation Closed choices "anytime", "fromStroke", "fromStrokeEnd", "fromRelax", "reflex", "quick", "smooth" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.row, window); compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.table, rows); compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.row, blend); compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.WINDOWS); compose/AutoMovieMotionHumanInterrupt.ts (AutoMovieMotionHumanInterrupt.table).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
 */
export namespace IAutoMovieMotionHumanInterrupt {
  /**
   * When an action may be cancelled: at any time, or from a phrase instant
   * to the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four windows.
   * @evidence contracts/development/design.md#principled-representation The standard instants of a phrase a cancel opens at: its stroke, its stroke's end and its relax.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each used by a shipped cancel table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A window that opens at an action's own instant is written as a row, not added as a name here.
   */
  export type Window = (readonly [
    "anytime",
    "fromStroke",
    "fromStrokeEnd",
    "fromRelax",
  ])[number];

  /**
   * How fast the next action blends in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; `BLENDS` gives each time.
   * @evidence contracts/development/design.md#principled-representation Four speeds of an inertialized transition, from a reflex that overrides the body through a voluntary change of one gesture to a deliberate change of the whole body's action.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each used by a shipped cancel table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union keyed into one table.
   */
  export type Blend = (readonly ["reflex", "quick", "smooth", "deliberate"])[number];
}
