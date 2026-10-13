/**
 * One homogeneous layer of an envelope assembly.
 *
 * Contributes `thickness / conductivity` m^2*K/W to its assembly's series
 * resistance. The production declares both values; the engine ships no material
 * table.
 *
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
