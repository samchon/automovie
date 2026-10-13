/** Named operating state of a valve, a damper, a switch or a similar device. */
export interface IAutoMovieServiceState {
  /** Author-named state such as `open`, `closed`, or `throttled`. */
  name: string;

  /**
   * Fraction of nominal capacity the state passes, within the closed range `[0,
   * 1]`. Exactly `0` isolates everything downstream of the device.
   */
  opening: number;
}
