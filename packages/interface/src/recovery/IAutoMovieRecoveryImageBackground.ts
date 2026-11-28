/**
 * Classify foreground by comparing each resident sRGB channel with a fixed
 * byte reference. A pixel is foreground when any absolute difference reaches
 * the supplied threshold.
 */
export interface IAutoMovieRecoveryImageBackground {
  /**
   * Reference red, green and blue values in channel order, each an integer from
   * 0 through 255.
   */
  rgb: [number, number, number];

  /** Finite channel distance in (0, 255]. Equality counts as foreground. */
  threshold: number;
}
