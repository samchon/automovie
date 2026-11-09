/**
 * Co-charted scalar observations at one physical row.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit fields preserve the producer's coefficient order, units and identities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named record replaces repeated anonymous copies of the same structural value.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration supplies no inferred geometry or fallback values.
 * @evidence contracts/development/common.md#meaningful-documentation Members state physical units, field ordering and coefficient-index meaning.
 */
export interface IAutoMovieRecoveryImageProfileSample<
  T extends number[] = number[],
> {
  /** Physical model Y coordinate, millimetres. */
  yMm: number;

  /** Ordered section-family scalar fields, millimetres. */
  values: T;
}
