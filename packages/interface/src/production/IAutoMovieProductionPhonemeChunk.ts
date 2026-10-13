/** One Kokoro stream chunk located on its model-native PCM clock. */
export interface IAutoMovieProductionPhonemeChunk {
  /** Chunk phonemes in synthesis order. */
  phonemes: string;

  /** Inclusive source-sample offset in the synthesized line. */
  startSample: number;

  /** Exclusive source-sample offset in the synthesized line. */
  endSample: number;
}
