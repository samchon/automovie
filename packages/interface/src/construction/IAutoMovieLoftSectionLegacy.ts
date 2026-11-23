/**
 * Prepared periodic spline coefficient rows used at native/basis continuation
 * boundaries.
 */
export namespace IAutoMovieLoftSectionLegacy {
  /**
   * Complete value or physical source2 basis data of one station.
   *
   * Each row contains order local-u controls followed by order local-v
   * controls. prepare and extend allocate their result rows and reject
   * incomplete/nonfinite data; endpoint adapters can borrow rows from an
   * immutable source family. Consumers preserve rows while phase readers retain
   * them. The readonly tuple fixes row count at the type boundary but does not
   * freeze its number arrays.
   */
  export type IPrepared =
    | {
        /**
         * Only coefficient values were prepared; jet evaluation must refuse
         * this variant.
         */
        kind: "value";

        /**
         * Number of periodic spline controls per local coordinate, inherited
         * from the admitted chain or endpoint family.
         */
        order: number;

        /**
         * One complete local coefficient row in millimetres, with 2 * order
         * entries.
         */
        rows: readonly [number[]];
      }
    | {
        /**
         * Coefficient values and both physical station derivative rows are
         * available.
         */
        kind: "jet";

        /**
         * Number of periodic spline controls per local coordinate; every
         * derivative row has the same 2 * order layout.
         */
        order: number;

        /**
         * Value, first physical-station derivative and second physical-station
         * derivative rows, in mm, mm/mm and 1/mm. These are not derivatives of
         * the normalized Hermite interval parameter.
         */
        rows: readonly [number[], number[], number[]];
      };
}
