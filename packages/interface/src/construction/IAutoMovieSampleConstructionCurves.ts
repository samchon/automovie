/** Sampling density for construction inspection polylines. */
export namespace IAutoMovieSampleConstructionCurves {
  /**
   * Optional density overrides, read synchronously and never retained or
   * changed. The sampler validates both resolved counts before reading chains,
   * even when there are no chains. Invalid counts throw a named Error. Outputs
   * use metres in the construction frame, converted from the source's
   * millimetre points.
   */
  export type IOptions = {
    /**
     * Uniform samples around [0,2pi), default 48; an integer at least 8 and
     * divisible by 4. The closing point is not repeated.
     */
    phases?: number;

    /**
     * Equal subdivisions per interval between owned endpoints and principal
     * layer stations, default 8; a positive integer.
     */
    steps?: number;
  };
}
