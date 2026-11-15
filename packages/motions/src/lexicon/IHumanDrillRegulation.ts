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
export interface IHumanDrillRegulation {
  /** Steps a minute, by the regulation's name of each time. */
  times: Readonly<Record<string, number>>;

  /** The step, metres, at the reference hip height of 0.93 m. */
  pace: number;
}

/**
 * Companion types of {@link IHumanDrillRegulation}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the names.
 * @evidence contracts/development/design.md#principled-representation A closed union of the regulations the table holds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The keys of `HUMAN_DRILL_CADENCES`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace IHumanDrillRegulation {
  /** The regulations. */
  export type Name = "british1792" | "french1791" | "us2021";
}
