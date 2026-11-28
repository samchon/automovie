/** Sampling density for construction inspection polylines. */
export namespace IAutoMovieSampleConstructionCurves {
  /**
   * Optional sampling density for construction inspection. The default is 48
   * phases per ring and eight equal station subdivisions per interval. Sample
   * coordinates are returned in construction-frame metres.
   */
  export type IOptions = {
    /**
     * Uniform ring sample count on [0, 2π), a safe integer of at least eight
     * and a multiple of four. The default is 48.
     */
    phases?: number;

    /**
     * Positive safe integer subdivisions between consecutive principal stations
     * or retained bounds. The default is eight.
     */
    steps?: number;
  };
}
