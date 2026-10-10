/**
 * Which head measurements the head solve meets, which it pursues second, and
 * which face channels it moves (`HUMAN_PERSON_HEAD_SOLVE`).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolveTable {
  /** Names of `HUMAN_HEAD_MEASUREMENTS` rules the solve meets. */
  measurements: string[];

  /**
   * Names of rules the solve pursues second, by least squares within the
   * freedom the met measurements leave; a target for one is optional and its
   * miss is reported, never refused.
   */
  secondary: string[];

  /** Head view face shape channels the solve sets. */
  channels: string[];
}
