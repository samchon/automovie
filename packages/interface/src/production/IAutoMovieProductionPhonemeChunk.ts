/**
 * One phoneme chunk of a dialogue line on the line's model-native sample clock.
 *
 * A speech model reports chunks of several phonemes; a forced aligner reports
 * one phoneme per chunk, recorded by the receipt's `aligner`. Engine's
 * `productionPhonemesToVisemes` gives each phoneme of a chunk an equal share of
 * its interval, so finer timing enters only as finer chunks.
 */
export interface IAutoMovieProductionPhonemeChunk {
  /**
   * IPA phoneme symbols in spoken order; whitespace and the stress and length
   * marks ˈ ˌ ː take no share.
   */
  phonemes: string;

  /** Inclusive model-native sample offset in the line. */
  startSample: number;

  /** Exclusive model-native sample offset in the line. */
  endSample: number;
}
