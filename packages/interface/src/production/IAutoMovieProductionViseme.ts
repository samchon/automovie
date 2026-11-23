import type { AutoMovieViseme } from "./AutoMovieViseme";

/**
 * One phoneme of a dialogue line with its viseme and its share of the line's
 * samples.
 *
 * Engine's `productionPhonemesToVisemes` gives each phoneme of a chunk an equal
 * share of the chunk's sample interval, in order, so the bounds are on the
 * line's model-native sample clock and may be fractional.
 */
export interface IAutoMovieProductionViseme {
  /** The phoneme's IPA symbol, as the chunk spells it. */
  phoneme: string;

  /** The phoneme's MPEG-4 viseme. */
  viseme: AutoMovieViseme;

  /**
   * Start of the phoneme's share in model-native samples from the line's first
   * sample; may be fractional.
   */
  startSample: number;

  /**
   * End of the phoneme's share, exclusive, in the same samples; after
   * `startSample`.
   */
  endSample: number;
}
