/**
 * One chromophore's spatial variation and its colour.
 *
 * @evidence contracts/common.md#principled-implementation Wavelength bounds, sinusoid population, spread and relative absorbance parameterize one spatial optical-density variation.
 * @evidence contracts/common.md#clear-and-simple-design The chromophore record groups the field's spatial and colour response properties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The generated field uses declared periodic frequencies and does not substitute a photographed skin texture.
 * @evidence contracts/common.md#meaningful-documentation Members give millimetres, natural-log spread and absorbance normalized to green.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The chromophore field schema is a data type with no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The chromophore field schema declaration performs no request coordination or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The chromophore field schema owns no runtime resource acquisition or release.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinChromophore {
  /**
   * The band of the variation, the shortest and longest wavelength in
   * millimetres. Frequencies are sampled log-uniformly in this band, then
   * their direction components round to tile harmonics; the rounded wavelength
   * can leave the band and repeated harmonics are possible. Amplitudes fall
   * as one over the rounded frequency.
   */
  wavelengths: [number, number];

  /** Number of frequency draws; a draw rounding to the zero harmonic contributes no sinusoid. */
  waves: number;

  /** Nominal green-primary optical-density scale, natural log units; wave-power normalization does not guarantee the sampled field's standard deviation. */
  spread: number;

  /** Its absorbance at the red, green and blue primaries relative to green. */
  absorbance: [number, number, number];
}
