/**
 * A scalar value and its first two derivatives in one independent parameter.
 *
 * The order is `[f(t), df/dt, d2f/dt2]`; the last entry is the full second
 * derivative, not a Taylor coefficient divided by two. If the scalar has
 * unit U and the parameter has unit P, the entries have units U, U/P and
 * U/P². The containing field or callback declares t and those units. Changing
 * parameterization requires the chain rule; sharing this representation does
 * not make physical-station, phase and normalized-coordinate jets interchangeable.
 * This mutable tuple is not a spatial vector. `Readonly<AutoMovieScalarJet2>`
 * may be used by a reader that does not permit changing its entries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies derivative order, unscaled second derivative, component units, parameter ownership and mutability.
 * @evidence contracts/development/design.md#principled-representation Three labelled entries encode a univariate order-two jet; finiteness, differentiability and the parameter domain remain the producing numerical operation's obligations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Human ArmJet arithmetic, FootConnection physical-station derivatives and TrunkQuadrant scalar derivatives use this common mathematical representation while their APIs retain the independent-parameter meaning.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tuple does not hide Taylor normalization or reinterpret three independent coordinates as derivatives; no dimension tag or numerical validator is invented.
 */
export type AutoMovieScalarJet2 = [
  value: number,
  firstDerivative: number,
  secondDerivative: number,
];
