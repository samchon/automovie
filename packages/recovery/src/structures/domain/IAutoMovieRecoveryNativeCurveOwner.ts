/**
 * A complete native cubic coefficient owner retained by a chart.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit fields preserve the producer's coefficient order, units and identities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named record replaces repeated anonymous copies of the same structural value.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred geometry or fallback values.
 * @evidence contracts/development/common.md#meaningful-documentation Members state physical units, field ordering and coefficient-index meaning.
 */
export interface IAutoMovieRecoveryNativeCurveOwner {
  /** Native cubic authority identity. */
  id: string;

  /** Ordered complete cubic owner indices in the recipe. */
  controlIds: [number, number, number, number];

  /** Original ordered cubic control net, millimetres. */
  net: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ];
}
