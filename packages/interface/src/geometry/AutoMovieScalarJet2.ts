/**
 * Mutable tuple holding a scalar value and its first two derivatives in one
 * declared parameter.
 *
 * For scalar unit U and parameter unit P, entries use U, U/P and U/P?. Convert
 * jets through the chain rule when changing the parameter.
 */
export type AutoMovieScalarJet2 = [
  value: number,
  firstDerivative: number,
  secondDerivative: number,
];
