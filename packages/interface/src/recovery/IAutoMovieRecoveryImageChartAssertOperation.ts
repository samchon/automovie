import type { IAutoMovieRecoveryImageInput } from "..";

/**
 * Admission and row checks for a supplied horizontal orthographic pixel chart.
 * The row checker accepts adjacent rows in either scan direction. The measured
 * observation view owns its published increasing Y order.
 */

export namespace IAutoMovieRecoveryImageChartAssertOperation {
  /**
   * Admit the camera and its representable physical image bounds. Supply the
   * current positive integer raster dimensions and calibrated camera. The
   * returned checker maps measured millimetre rows to unclipped pixel-cell
   * addresses.
   */

  export type Operation = (
    view: Pick<
      IAutoMovieRecoveryImageInput["views"][number],
      "width" | "height" | "camera"
    >,
  ) => {
    /**
     * Check one measured row and, when supplied, its previously admitted
     * neighbor in the same chart. A neighboring pair must be one raster row
     * apart, with horizontal overlap or diagonal contact. Either scan direction
     * is accepted. Omit the neighbor to check the row independently.
     */
    assertRow: (
      row: {
        /**
         * Physical Y of the occupied pixel-row center, in millimetres.
         */
        yMm: number;
        /**
         * Lower occupied pixel-cell edge along image U, in millimetres.
         */
        lowerMm: number;
        /**
         * Upper occupied pixel-cell edge along image U, in millimetres.
         * Greater than lowerMm.
         */
        upperMm: number;
      },
      previous?: {
        /**
         * Physical Y of the neighboring admitted row, in millimetres.
         */
        yMm: number;
        /**
         * Lower occupied pixel-cell edge in the previously admitted row, in
         * millimetres.
         */
        lowerMm: number;
        /**
         * Upper occupied pixel-cell edge in the previously admitted row, in
         * millimetres.
         */
        upperMm: number;
      },
    ) => void;
  };
}
