/**
 * Prepared periodic spline coefficient rows used at native/basis continuation boundaries.
 *
 * @evidence contracts/development/design.md#principled-representation The prepared variant records whether only values or physical station derivatives through order two were requested.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieLoftSectionLegacy.prepare/extend and AutoMovieLoftSection share the one row contract used by phase and jet evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This boundary supports the spline basis explicitly; prepare refuses a harmonic chain rather than reinterpreting its coefficient layout.
 * @evidence contracts/development/common.md#meaningful-documentation The prepared record documents coefficient layout, physical derivative units, borrowing and numerical admission.
 */
export namespace IAutoMovieLoftSectionLegacy {
  /**
   * Complete value or physical source2 basis data of one station.
   *
   * Each row contains order local-u controls followed by order local-v controls. prepare and extend allocate their result rows and reject incomplete/nonfinite data; endpoint adapters can borrow rows from an immutable source family. Consumers preserve rows while phase readers retain them. The readonly tuple fixes row count at the type boundary but does not freeze its number arrays.
   *
   * @evidence contracts/development/design.md#principled-representation The discriminant distinguishes one value row from three actual station derivative rows of the same generating field.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Phase reads row zero of either variant, while jet requires all three rows; no unavailable derivative row exists on the value variant.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Value-only preparation never fills missing first/second derivatives with zero.
   * @evidence contracts/development/common.md#meaningful-documentation Order is value, first station and second station, with spline control layout.
   */
  export type IPrepared =
    | {
        /** Only coefficient values were prepared; jet evaluation must refuse this variant. */
        kind: "value";

        /** Number of periodic spline controls per local coordinate, inherited from the admitted chain or endpoint family. */
        order: number;

        /** One complete local coefficient row in millimetres, with 2 * order entries. */
        rows: readonly [number[]];
      }
    | {
        /** Coefficient values and both physical station derivative rows are available. */
        kind: "jet";

        /** Number of periodic spline controls per local coordinate; every derivative row has the same 2 * order layout. */
        order: number;

        /** Value, first physical-station derivative and second physical-station derivative rows, in mm, mm/mm and 1/mm. These are not derivatives of the normalized Hermite interval parameter. */
        rows: readonly [number[], number[], number[]];
      };
}
