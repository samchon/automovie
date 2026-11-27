import type { AutoMovieViseme } from "./AutoMovieViseme";

/**
 * One phoneme's viseme over a half-open interval on the film-global emission
 * clock, in frames that may be fractional.
 */
export interface IAutoMovieDialogueMouthRange {
  /** Inclusive start on the emission clock, in film frames; may be fractional. */
  startFrame: number;

  /** Exclusive end on the emission clock, in film frames; after `startFrame`. */
  endFrame: number;

  /** The phoneme's viseme, or `sil` for a pause between phonemes. */
  viseme: AutoMovieViseme;
}
