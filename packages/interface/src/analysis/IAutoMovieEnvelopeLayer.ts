/**
 * One homogeneous layer of an envelope assembly.
 *
 * Contributes `thickness / conductivity` m^2*K/W to its assembly's series
 * resistance. The production declares both values; the engine ships no material
 * table.
 *
 * @evidence contracts/development/design.md#principled-representation A homogeneous slab's conductive resistance is its thickness over its conductivity, the series term of the one-dimensional steady-state network, so two numbers per layer fully determine its contribution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two quantities the network reads plus an id for diagnostics; layer order is kept by the assembly's array and does not change the series sum.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither value has a default or a material lookup, and the analyzer refuses a non-positive or non-finite one rather than clamping it.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states the resistance contribution and its unit, that the production declares the values with no shipped table, and each property's unit, range and uniqueness scope.
 */
export interface IAutoMovieEnvelopeLayer {
  /** Stable layer identity, unique within its assembly. */
  id: string;

  /** Thickness in metres; finite and strictly positive. */
  thickness: number;

  /** Thermal conductivity in W/(m*K); finite and strictly positive. */
  conductivity: number;
}
