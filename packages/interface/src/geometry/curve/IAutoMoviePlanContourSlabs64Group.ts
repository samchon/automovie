import type { IAutoMoviePreparedContourEvent64 } from "./IAutoMoviePreparedContourEvent64";

/**
 * One connected lower/upper ring group in a planned saved-section interval. Plans
 * own the index arrays but borrow prepared critical-event records. Later boundary
 * preparation may add an unsupported reason to this same object.
 *
 * @evidence contracts/development/design.md#principled-representation Side-local integer ordinals preserve separate section domains; empty sides represent terminals or unresolved incidence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieContourSlabs64 supplies groups to boundary preparation and contour face generation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported groups retain their incidence and reason instead of being silently rematched; ordinary inferred matching remains the planner's explicit legacy mode.
 * @evidence contracts/development/common.md#meaningful-documentation Defines side index scopes, event borrowing, empty groups and later reason mutation.
 */
export interface IAutoMoviePlanContourSlabs64Group {
  /** Local ring ordinals in rings[k-1], in retained group order; may be empty for a minimum or an unresolved event. */
  a: number[];

  /** Local ring ordinals in rings[k]; may be empty for a maximum or an unresolved event. */
  b: number[];

  /** Prepared events assigned to this group, borrowed from the document. Empty identifies an ordinary continuation candidate, not proof that it is supported. */
  critical: IAutoMoviePreparedContourEvent64[];

  /** Local reason to skip surface generation. Absent means this planning stage found no reason; later sampling/boundary stages may still reject the group. */
  unsupported?: string;
}
