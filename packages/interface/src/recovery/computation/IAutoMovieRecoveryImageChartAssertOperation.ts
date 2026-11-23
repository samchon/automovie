import type { IAutoMovieRecoveryImageInput } from "../../index";

/**
 * Admit the finite metric pixel chart and verify measured row/cell coordinates.
 * Adjacent occupied rows must form one eight-connected foreground component.
 * The relative binary64 bound covers arithmetic roundoff, not segmentation or
 * camera uncertainty. A chart whose frame offset overwhelms pixel increments
 * refuses instead of publishing aliased stations as calibrated measurements.
 */

export namespace IAutoMovieRecoveryImageChartAssertOperation {
  /**
   * Admit the finite metric pixel chart and verify measured row/cell
   * coordinates. Adjacent occupied rows must form one eight-connected
   * foreground component. The relative binary64 bound covers arithmetic
   * roundoff, not segmentation or camera uncertainty. A chart whose frame
   * offset overwhelms pixel increments refuses instead of publishing aliased
   * stations as calibrated measurements.
   */

  export type Operation = (
    view: Pick<
      IAutoMovieRecoveryImageInput["views"][number],
      "width" | "height" | "camera"
    >,
  ) => {
    /**
     * Validates finite ordered physical image-support bounds and increasing
     * station order; omission of previous admits the first row independently.
     */
    assertRow: (
      row: {
        /**
         * Vertical observation station in the declared registered millimetre
         * chart.
         */
        yMm: number;
        /**
         * Lower physical support or componentwise enclosure bound, in the
         * declared registered millimetre frame.
         */
        lowerMm: number;
        /**
         * Upper physical support or componentwise enclosure bound, in the
         * declared registered millimetre frame.
         */
        upperMm: number;
      },
      previous?: {
        /**
         * Vertical observation station in the declared registered millimetre
         * chart.
         */
        yMm: number;
        /**
         * Lower physical support or componentwise enclosure bound, in the
         * declared registered millimetre frame.
         */
        lowerMm: number;
        /**
         * Upper physical support or componentwise enclosure bound, in the
         * declared registered millimetre frame.
         */
        upperMm: number;
      },
    ) => void;
  };
}
