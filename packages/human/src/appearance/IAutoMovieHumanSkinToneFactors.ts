/** Multipliers at one vertex. */
export interface IAutoMovieHumanSkinToneFactors {
  /** Melanin multiplier. */
  melanin: number;

  /** Haemoglobin multiplier. */
  haemoglobin: number;

  /** Normal-map slope factor. */
  relief: number;

  /** Final albedo multiplier, below one in cavities. */
  shade: number;
}
