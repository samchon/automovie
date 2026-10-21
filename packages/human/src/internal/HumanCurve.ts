/** Common geometric authority for generated Human sections. Physical positions
 * use mm in the observed neutral frame: +X forward, +Y up, signed lateral Z.
 * This internal frame is transported once when a consumer needs another chart.
 */
export namespace HumanCurve {
  /** Physical vector, or a dimensionless direction where explicitly documented. */
  export type Vector = [number, number, number];

  /** A generated periodic radial curve in an explicitly owned plane. */
  export interface Section {
    /** Physical feature identity, shared by skin and construction. */
    id: string;

    /** Physical longitudinal station, mm, independent of circumferential phase. */
    stationMm: number;

    /** Plane centre in the common reference frame, mm. */
    originMm: Vector;

    /** Orthonormal directions for phase zero and positive quarter-turn. */
    axisU: Vector;

    /** Positive quarter-turn direction; physical orientation is never inferred. */
    axisV: Vector;

    /** Radial Fourier coefficients in mm: c0, cos(1), sin(1), cos(2), sin(2), …
     * The phase is radians. These generated coefficients are not a conversion
     * or truncation of the independently retained recovered Hermite artifacts.
     */
    coefficientsMm: number[];

    /** An explicitly generated endpoint contour death. A pole is emitted as
     * one vertex and a triangle fan, never a small artificial closed ring.
     * Omission retains an ordinary periodic section.
     */
    topology?: "pole";
  }
}
