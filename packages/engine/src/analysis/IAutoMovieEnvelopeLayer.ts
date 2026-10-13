/** One homogeneous layer of an envelope assembly. */
export interface IAutoMovieEnvelopeLayer {
  /** Stable layer identity within the assembly. */
  id: string;
  /** Thickness in metres; strictly positive. */
  thickness: number;
  /** Thermal conductivity in W/(m*K); strictly positive. */
  conductivity: number;
}
