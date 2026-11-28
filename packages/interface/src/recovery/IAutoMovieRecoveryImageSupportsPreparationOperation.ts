import type { IAutoMovieRecoveryImageObservation } from "..";

/**
 * Prepare a shared millimetre row chart for measured orthographic image
 * support.
 */

export namespace IAutoMovieRecoveryImageSupportsPreparationOperation {
  /**
   * Admit at least three measured views under explicit view and source-row
   * limits. Intersect their physical Y ranges and collect the original
   * stations in that interval. Return view-aligned support bounds evaluated
   * at the same stations.
   */

  export type Operation = (
    observation: IAutoMovieRecoveryImageObservation,
    limits: {
      /** Maximum admitted measured view count, as a positive safe integer. */
      maxViews: number;
      /**
       * Maximum total original support rows, as a positive safe integer,
       * counted before interpolation.
       */
      maxRows: number;
    },
  ) => {
    /** Lower endpoint of the shared physical Y interval, in millimetres. */
    lower: number;

    /** Upper endpoint of the shared physical Y interval, in millimetres. */
    upper: number;

    /** Horizontal direction coefficients in source view order. */
    directions: {
      /** Dimensionless cosine of the supplied azimuth, along +X. */
      c: number;
      /** Dimensionless sine of the supplied azimuth, along +Z. */
      s: number;
    }[];

    /** Unique original Y stations in the shared interval, increasing in millimetres. */
    stations: number[];

    /**
     * Support intervals indexed by source view and then by common station.
     * At an unmeasured station, interpolate between adjoining rows of that
     * view.
     */
    supports: {
      /** Lower support bound along that view's image U, in millimetres. */
      lowerMm: number;
      /** Upper support bound along that view's image U, in millimetres. */
      upperMm: number;
    }[][];
  };
}
