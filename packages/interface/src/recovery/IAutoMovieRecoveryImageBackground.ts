/**
 * Fixed-background foreground classification for resident sRGB images. A pixel
 * is foreground when its maximum absolute channel distance reaches the
 * threshold.
 */
export interface IAutoMovieRecoveryImageBackground {
  /** Fixed sRGB reference channels, each an integer in [0, 255]. */
  rgb: [number, number, number];

  /** Positive channel-distance threshold at most 255; equality marks foreground. */
  threshold: number;
}
