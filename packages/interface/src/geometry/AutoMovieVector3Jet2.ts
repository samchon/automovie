import type { AutoMovieScalarJet2 } from "./AutoMovieScalarJet2";

/**
 * Mutable XYZ tuple of scalar order-two jets, with the same independent
 * parameter for each component.
 *
 * Each axis contains its value, first derivative and full second derivative.
 * Both tuple levels are mutable.
 */
export type AutoMovieVector3Jet2 = [
  x: AutoMovieScalarJet2,
  y: AutoMovieScalarJet2,
  z: AutoMovieScalarJet2,
];
