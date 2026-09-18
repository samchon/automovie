import { IAutoMovieVisualChange } from "./IAutoMovieVisualChange";
import { IAutoMovieVisualChangeCounts } from "./IAutoMovieVisualChangeCounts";

/**
 * Deterministic visual progress report between two revision snapshots.
 *
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Exposes every classified view and exact state totals.
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-evidence-boundary Represents progress without carrying a verdict, criterion, receipt, or structural change.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Defines the versioned output of the deterministic join.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-evidence-separation Keeps the output outside the delivery-evidence and compiled-structure contracts.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualChangeReport {
  /**
   * Report schema version.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Makes the portable comparison format explicit.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Types the first report schema.
   */
  version: 1;

  /**
   * Shared catalog identity.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Shows which observation population was compared.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Preserves the validated same-catalog precondition.
   */
  catalog: string;

  /**
   * Earlier revision identity.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Binds the before side to its named revision.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Copies the earlier snapshot identity.
   */
  fromRevision: string;

  /**
   * Later revision identity.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-catalog-identity Binds the after side to its named revision.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-revision-snapshot Copies the later snapshot identity.
   */
  toRevision: string;

  /**
   * Exact totals for the four states.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Makes unchanged work visible in the summary beside every other state.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Carries totals derived from the complete returned population.
   */
  counts: IAutoMovieVisualChangeCounts;

  /**
   * Complete code-unit-sorted visual comparison.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Preserves every identity from either revision with one status.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Carries the deterministic union join.
   */
  views: IAutoMovieVisualChange[];
}
