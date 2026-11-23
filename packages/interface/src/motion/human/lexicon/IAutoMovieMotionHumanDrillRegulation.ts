/**
 * One drill regulation's marching times and pace (`HUMAN_DRILL_CADENCES`): the
 * steps a minute of each named time and the length of the step, so the era of a
 * film's drill is a row a march names, not a law.
 */
export interface IAutoMovieMotionHumanDrillRegulation {
  /** Steps a minute, by the regulation's name of each time. */
  times: Readonly<Record<string, number>>;

  /** The step, metres, at the reference hip height of 0.93 m. */
  pace: number;
}

/** Contracts used by regulated, HUMAN_DRILL_CADENCES. */
export namespace IAutoMovieMotionHumanDrillRegulation {
  /** The regulations. */
  export type Name = "british1792" | "french1791" | "us2021";
}
