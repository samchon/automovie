/**
 * A quantity sampled at published ages, read between samples by straight lines.
 *
 * Growth references publish a value per age group, so a curve stores those values at the ages they describe (the centre of an age bin, or the exact age of a monthly reference) and nothing between. {@link interpolateAutoMovieHumanGrowthCurve} draws straight lines between neighbouring samples and holds the first and last values beyond the ends, so a curve never invents a trend outside the ages its source measured; a source that does state the trend outside its ages is written as an explicit sample whose JSDoc derives it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanGrowthCurve {
  /** Sample ages in years, strictly increasing, at least one. */
  ages: number[];

  /** Value at each sample age, in the unit the owning constant states; as long as `ages`. */
  values: number[];
}
