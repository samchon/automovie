/**
 * World-space phase readings independent of physical-station derivative
 * availability.
 */
export namespace IAutoMovieConstructionProfilePhase {
  /**
   * Actual world value and phase derivatives at one fixed physical station.
   *
   * ProfilePhase maps original local derivatives through the station's plane
   * and scales them by the signed piece-clock span and its square. Each query
   * returns fresh mutable vectors after checking their finite components.
   */
  export interface IReading {
    /** World point, kernel millimetres. */
    p: [number, number, number];

    /** First derivative per normalized piece coordinate. */
    t: [number, number, number];

    /**
     * Second derivative in millimetres per squared normalized piece coordinate,
     * or null where the owner supplies no phase2.
     */
    tt: [number, number, number] | null;
  }
}
