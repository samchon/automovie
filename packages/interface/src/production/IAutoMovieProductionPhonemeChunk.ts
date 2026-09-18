/**
 * One Kokoro stream chunk located on its model-native PCM clock.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-seek-chunk-equivalence Exposes `IAutoMovieProductionPhonemeChunk` as the portable data boundary for the sound seek chunk equivalence requirement.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-extended-group-source-aggregation Types `IAutoMovieProductionPhonemeChunk` for the spatial extended group source aggregation system contract.
 */
export interface IAutoMovieProductionPhonemeChunk {
  /**
   * Chunk phonemes in synthesis order.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-seek-chunk-equivalence Exposes `phonemes` as the portable data boundary for the sound seek chunk equivalence requirement.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-extended-group-source-aggregation Types `phonemes` for the spatial extended group source aggregation system contract.
   */
  phonemes: string;
  /**
   * Inclusive source-sample offset in the synthesized line.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-seek-chunk-equivalence Exposes `startSample` as the portable data boundary for the sound seek chunk equivalence requirement.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-extended-group-source-aggregation Types `startSample` for the spatial extended group source aggregation system contract.
   */
  startSample: number;
  /**
   * Exclusive source-sample offset in the synthesized line.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-seek-chunk-equivalence Exposes `endSample` as the portable data boundary for the sound seek chunk equivalence requirement.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-extended-group-source-aggregation Types `endSample` for the spatial extended group source aggregation system contract.
   */
  endSample: number;
}
