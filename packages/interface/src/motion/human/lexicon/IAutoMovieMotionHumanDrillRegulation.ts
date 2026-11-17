/**
 * One drill regulation's marching times and pace (`HUMAN_DRILL_CADENCES`):
 * the steps a minute of each named time and the length of the step, so the
 * era of a film's drill is a row a march names, not a law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a row holds and its units.
 * @evidence contracts/development/design.md#principled-representation Times in steps a minute by name, the pace in metres for a soldier whose hip stands 0.93 m high, scaled by the body's hip height as the march scales its step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two quantities the march reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A time is named by the regulation's own word, never a speed.
 */
export interface IAutoMovieMotionHumanDrillRegulation {
  /** Steps a minute, by the regulation's name of each time. */
  times: Readonly<Record<string, number>>;

  /** The step, metres, at the reference hip height of 0.93 m. */
  pace: number;
}

/**
 * Contracts used by regulated, HUMAN_DRILL_CADENCES.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Contracts used by regulated, HUMAN_DRILL_CADENCES.
 * @evidence contracts/development/design.md#principled-representation Closed choices "british1792", "french1791", "us2021" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (regulated); lexicon/HUMAN_DRILL_CADENCES.ts (HUMAN_DRILL_CADENCES).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in regulated.
 */
export namespace IAutoMovieMotionHumanDrillRegulation {
  /**
   * The regulations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The regulations.
   * @evidence contracts/development/design.md#principled-representation Closed choices "british1792", "french1791", "us2021" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HUMAN_DRILL_CADENCES.ts (HUMAN_DRILL_CADENCES).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HUMAN_DRILL_CADENCES.
   */
  export type Name = "british1792" | "french1791" | "us2021";
}
