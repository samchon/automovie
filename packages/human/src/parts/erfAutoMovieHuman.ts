/**
 * The error function, by the rational approximation of Abramowitz and Stegun (1964, Handbook of Mathematical Functions, formula 7.1.26), absolute error under 1.5e-7: the normal distribution's integral that rounds a relief's border.
 *
 * @param x The argument
 * @returns erf(x)
 */
export function erfAutoMovieHuman(x: number): number {
  const sign: number = x < 0 ? -1 : 1;
  const t: number = 1 / (1 + 0.3275911 * Math.abs(x));
  const y: number =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}
