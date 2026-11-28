/**
 * The complete periodic basis coefficients at one endpoint, in value, first
 * physical-station derivative and second physical-station derivative order.
 * Each row contains 2 × order coefficients. Supply the three functions before
 * extending the section by a station displacement in millimetres.
 */
export type AutoMovieLoftSectionLegacyRows = readonly [
  readonly number[],
  readonly number[],
  readonly number[],
];
