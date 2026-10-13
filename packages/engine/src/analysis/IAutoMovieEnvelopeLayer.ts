/**
 *
 * One homogeneous layer of an envelope assembly.
 *
 * Contributes `thickness / conductivity` m^2*K/W to its assembly's series
 * resistance. The production declares both values; the engine ships no material
 * table.
 *
 * @evidence contracts/common.md#principled-implementation A homogeneous slab's conductive resistance is its thickness over its conductivity, the series term of the steady-state network.
 * @evidence contracts/common.md#clear-and-simple-design Carries no density or heat capacity, because the solver is steady-state and transient storage is reported unsupported.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither value has a default or a material lookup, and the solver refuses a non-positive or non-finite one.
 * @evidence contracts/common.md#meaningful-documentation States the resistance contribution, the units, the scope of id uniqueness, and that values come from the production.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record read once in its assembly's resistance sum. Contributes one term to one assembly's resistance in one study; nothing is shared. An id and two numbers owned by the assembly for one study.
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
