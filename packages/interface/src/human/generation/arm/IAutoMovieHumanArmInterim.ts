/**
 * Type contracts exchanged by AutoMovieHumanArmInterim; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmInterim {
  /**
   * The placement argument of AutoMovieHumanArmInterim.sites. The arm's site
   * laws.
   *
   * @param side The arm.
   * @param inputs The arm's tapes and the hands' dimensions, calibration mm.
   * @param elbow The elbow centre.
   * @param wrist The wrist centre.
   * @param placement Actual GH projection and rigid humerus from the same
   *   production skeleton, calibration mm.
   * @param crease Include the independent public palm-crease course.
   * @param radialCenter The palm breadth-centre offset from MCP3 along radial
   *   u, mm; zero for a caller without the source hand record.
   * @returns The site laws.
   */
  export type ISitesPlacement = {
    /**
     * Glenohumeral centre's lateral projection from the body's median plane,
     * calibration millimetres.
     */
    projection: number;
    /** Rigid shoulder-to-elbow centre distance, calibration millimetres. */
    humerus: number;
  };
}
