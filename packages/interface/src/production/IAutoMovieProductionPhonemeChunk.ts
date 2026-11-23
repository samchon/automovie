/**
 * One supplied Kokoro phoneme chunk on its model-native PCM clock; this
 * repository has no synthesis writer for the enclosing receipt.
 */
export interface IAutoMovieProductionPhonemeChunk {
  /** Chunk phonemes in synthesis order. */
  phonemes: string;

  /** Inclusive source-sample offset in the synthesized line. */
  startSample: number;

  /** Exclusive source-sample offset in the synthesized line. */
  endSample: number;
}
