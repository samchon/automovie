import type { AutoMovieScalarJet2 } from "./AutoMovieScalarJet2";

/**
 * Component-first order-two jet of a three-component vector.
 *
 * Entries are the x, y and z scalar jets, each `[value, first, second]` in the
 * same independent parameter. This is not derivative-first storage `[position,
 * firstVector, secondVector]`. The containing field declares coordinate frame,
 * vector units and parameter units; second derivatives are unscaled. Both the
 * outer tuple and its scalar tuples are mutable.
 */
export type AutoMovieVector3Jet2 = [
  x: AutoMovieScalarJet2,
  y: AutoMovieScalarJet2,
  z: AutoMovieScalarJet2,
];
