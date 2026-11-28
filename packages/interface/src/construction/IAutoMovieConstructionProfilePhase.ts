/**
 * World-space phase readings independent of physical-station derivative
 * availability.
 */
export namespace IAutoMovieConstructionProfilePhase {
  /**
   * World point and phase derivatives at one fixed physical station. Phase uses
   * the piece's normalized coordinate, including its traversal direction. The
   * second derivative may be absent independently of the point and first
   * derivative.
   */
  export interface IReading {
    /** World position [x, y, z] in kernel millimetres. */
    p: [number, number, number];

    /**
     * First world derivative in millimetres per normalized piece-coordinate
     * unit.
     */
    t: [number, number, number];

    /**
     * Second world derivative in millimetres per squared piece-coordinate unit,
     * or null when no second phase derivative was supplied.
     */
    tt: [number, number, number] | null;
  }
}
