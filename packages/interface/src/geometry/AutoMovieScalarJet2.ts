/**
 * A scalar value and its first two derivatives in one independent parameter.
 *
 * The order is `[f(t), df/dt, d2f/dt2]`; the last entry is the full second
 * derivative, not a Taylor coefficient divided by two. If the scalar has unit U
 * and the parameter has unit P, the entries have units U, U/P and U/P². The
 * containing field or callback declares t and those units. Changing
 * parameterization requires the chain rule; sharing this representation does
 * not make physical-station, phase and normalized-coordinate jets
 * interchangeable. This mutable tuple is not a spatial vector.
 * `Readonly<AutoMovieScalarJet2>` may be used by a reader that does not permit
 * changing its entries.
 */
export type AutoMovieScalarJet2 = [
  value: number,
  firstDerivative: number,
  secondDerivative: number,
];
