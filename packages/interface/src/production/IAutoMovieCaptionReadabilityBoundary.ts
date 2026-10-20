/**
 * One production-owned numeric caption boundary. Its enclosing profile field determines maximum versus minimum and the unit.
 *
 * @evidence contracts/common.md#principled-implementation A numeric threshold and explicit equality policy define one comparison boundary; render uses upper-bound comparisons for maxima and lower-bound comparisons for duration and gap minima, relying on callers for the documented finite nonnegative domain.
 * @evidence contracts/common.md#clear-and-simple-design Value and inclusivity are shared by all five profile measurements, while the profile field supplies direction and units instead of duplicating those choices on each boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality follows the authored inclusive flag without a hidden tolerance or global preset, so an exclusive boundary cannot pass by using the maximum rule's inclusive comparison.
 * @evidence contracts/common.md#meaningful-documentation Gives numeric domain, equality semantics and ownership of comparison direction and measurement unit on the enclosing profile field.
 */
export interface IAutoMovieCaptionReadabilityBoundary {
  /** Finite non-negative threshold value. */
  value: number;

  /** Whether equality satisfies this boundary. */
  inclusive: boolean;
}
