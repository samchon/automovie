import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieVisualChangeStatus } from "./AutoMovieVisualChangeStatus";

/**
 * One deterministic subject-view comparison result.
 *
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Preserves every common and one-sided observation with one explicit state.
 * @evidence requirements/review/visual-change-reporting.md#review-visual-change-evidence-boundary Carries digest equality only and no quality or review conclusion.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Types the sorted joined record and its nullable sides.
 * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-evidence-separation Keeps progress facts structurally separate from review evidence and subject geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualChange {
  /**
   * Stable subject identity shared with the snapshot records.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Identifies the subject whose view received this status.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Preserves the first sorted key component.
   */
  subject: string;
  /**
   * Stable view identity shared with the snapshot records.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Identifies the repeatable view whose bytes were compared.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Preserves the second sorted key component.
   */
  view: string;
  /**
   * Exactly one of the four visual change states.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Exposes changed, unchanged, new, or gone without dropping unchanged entries.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Types the exhaustive join outcome.
   */
  status: AutoMovieVisualChangeStatus;
  /**
   * Earlier digest, or null when this view is new.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Preserves the earlier side needed to inspect the classification.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Makes absence explicit for a later-only identity.
   */
  before: AutoMovieContentDigest | null;
  /**
   * Later digest, or null when this view is gone.
   *
   * @evidence requirements/review/visual-change-reporting.md#review-visual-change-four-states Preserves the later side needed to inspect the classification.
   * @evidence specifications/review-and-acceptance/visual-change-reporting.md#review-system-visual-change-states Makes absence explicit for an earlier-only identity.
   */
  after: AutoMovieContentDigest | null;
}
