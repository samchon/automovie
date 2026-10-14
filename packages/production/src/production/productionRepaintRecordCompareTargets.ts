import { IAutoMovieRepaintRecordTarget } from "./IAutoMovieRepaintRecordTarget";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Sort admitted targets by shot, then kind, then record ID using locale-independent UTF-16 order. Equal complete identities compare zero, leaving repeated targets in the stable sort rather than deduplicating reader requests.
 *
 * @evidence contracts/common.md#principled-implementation Lexicographic composition of the shared code-unit comparator orders all three identity fields without host locale or normalization.
 * @evidence contracts/common.md#clear-and-simple-design The comparator owns target order while identity admission and duplicate/effect semantics remain with the collector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture order or case folding selects a winner, and equal targets are not treated as reusable callback effects.
 * @evidence contracts/common.md#meaningful-documentation Prose gives field precedence, UTF-16 order and equal-target stable-sort meaning.
 * @evidence contracts/performance.md#efficient-algorithms At most three common-prefix string comparisons use constant additional storage; the collector's total sort cost remains O(N log N) comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing engine code-unit owner replaces a copied scalar comparator; no target-order result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the comparison number escapes and neither target is retained; no locale or reader handle is acquired.
 */
export const productionRepaintRecordCompareTargets: (left: IAutoMovieRepaintRecordTarget, right: IAutoMovieRepaintRecordTarget) => number = (
  left: IAutoMovieRepaintRecordTarget,
  right: IAutoMovieRepaintRecordTarget,
): number =>
  compareCodeUnits(left.shot, right.shot) ||
  compareCodeUnits(left.kind, right.kind) ||
  compareCodeUnits(left.recordId, right.recordId);
