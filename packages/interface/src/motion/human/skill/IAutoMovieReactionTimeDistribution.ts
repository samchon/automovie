/**
 * The three ex-Gaussian parameters of a reaction delay, all in seconds.
 * Orienting and striking supply their own studied values to
 * HumanSkill.reaction, which draws the Gaussian component plus an exponential
 * tail.
 */
export type IAutoMovieReactionTimeDistribution = {
  /** Gaussian reaction-delay mean, seconds. */
  mu: number;
  /** Gaussian reaction-delay standard deviation, seconds. */
  sigma: number;
  /**
   * Exponential tail mean, seconds; added to the Gaussian delay for the
   * ex-Gaussian reaction law.
   */
  tau: number;
};
