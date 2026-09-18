import { IAutoMovieVisualRevisionView } from "./IAutoMovieVisualRevisionView";

/**
 * One named visual catalog at one production revision.
 *
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Binds a unique visual population to its revision and catalog identity.
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-digest-reuse Makes validation possible before any comparison result is returned.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Defines the complete input snapshot of the comparison.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualRevisionSnapshot {
  /**
   * Non-blank production or compile revision identity.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Names the exact revision whose observations are listed.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Types the revision identity copied into the report.
   */
  revision: string;
  /**
   * Non-blank identity of the observation population.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Prevents unrelated delivery and inspection view sets from being compared as one.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Types the equality precondition between snapshots.
   */
  catalog: string;
  /**
   * Unique subject-view records in arbitrary input order.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-digest-reuse Supplies validated existing digests without exposing image bytes.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Carries the population whose ordering is non-semantic.
   */
  views: IAutoMovieVisualRevisionView[];
}
