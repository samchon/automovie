/**
 * A null span denotes the existing constant ellipse cap law.
 *
 * @evidence contracts/development/design.md#principled-representation Pole, near and span are physical station-mm data; a null span denotes the constant ellipse law instead of a finite transition interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftViewSource captures the existing cap shoulder law for subsequent scalar reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nullable fields permit inconsistent combinations structurally; source preparation establishes matching near/span values.
 * @evidence contracts/development/common.md#meaningful-documentation States pole units and constant-law null semantics.
 */
export interface IAutoMovieLoftViewSourceCap {
  /** Declared pole station, mm. */
  pole: number;

  /** Original nearest non-pole knot station; null for the constant law. */
  near: number | null;

  /** Its actual distance from the pole; null for the constant law. */
  span: number | null;
}
