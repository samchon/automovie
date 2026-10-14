/**
 * One homogeneous layer of an envelope assembly.
 *
 * Contributes `thickness / conductivity` m^2*K/W to its assembly's series
 * resistance. The production declares both values; the engine ships no material
 * table.
 *
 * @evidence contracts/common.md#principled-implementation A homogeneous slab's conductive resistance is its thickness over its conductivity, the series term of the one-dimensional steady-state network, so two numbers per layer fully determine its contribution.
 * @evidence contracts/common.md#clear-and-simple-design Only the two quantities the network reads plus an id for diagnostics; layer order is kept by the assembly's array and does not change the series sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither value has a default or a material lookup, and the analyzer refuses a non-positive or non-finite one rather than clamping it.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the resistance contribution and its unit, that the production declares the values with no shipped table, and each property's unit, range and uniqueness scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no runtime code; the analyzer reads each layer once in its assembly's resistance sum.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; each layer contributes one term to one assembly in one study.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record of an id and two numbers owned by its assembly; nothing derived from it is retained.
 * @author Samchon
 */
export interface IAutoMovieEnvelopeLayer {
  /** Stable layer identity, unique within its assembly. */
  id: string;

  /** Thickness in metres; finite and strictly positive. */
  thickness: number;

  /** Thermal conductivity in W/(m*K); finite and strictly positive. */
  conductivity: number;
}
