/**
 * One supplied Kokoro phoneme chunk on its model-native PCM clock; this repository has no synthesis writer for the enclosing receipt.
 *
 * @evidence contracts/common.md#principled-implementation The supplied receipt preserves phoneme text and a half-open native-sample interval; productionPhonemesToVisemes maps admitted chunk fractions to authored film-frame bins. This conversion does not establish synthesis provenance or independently measured phoneme onset.
 * @evidence contracts/common.md#clear-and-simple-design Keeps native sample timing beside phoneme text rather than prematurely rounding every phoneme to a production frame or duplicating synthesized PCM.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These are model stream chunks, not independently measured phoneme onset timestamps; bounded frame binning may group several tokens into one mouth target.
 * @evidence contracts/common.md#meaningful-documentation Defines synthesis order and inclusive-start exclusive-end offsets on the model-native PCM sample clock.
 * @author Samchon
 */
export interface IAutoMovieProductionPhonemeChunk {
  /** Chunk phonemes in synthesis order. */
  phonemes: string;

  /** Inclusive source-sample offset in the synthesized line. */
  startSample: number;

  /** Exclusive source-sample offset in the synthesized line. */
  endSample: number;
}
