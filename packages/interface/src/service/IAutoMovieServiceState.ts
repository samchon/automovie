/** Authored operating state of a service device. */
export interface IAutoMovieServiceState {
  /** Author-named state such as `open`, `closed`, or `throttled`. */
  name: string;

  /**
   * Authored opening fraction in [0, 1]. Operating reach treats zero as
   * isolating; partial opening does not currently calculate proportional
   * capacity or physical flow.
   */
  opening: number;
}
