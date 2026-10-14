
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Order findings lexicographically by phase, normalized null-path position, code and message.
 *
 * Each comparison uses UTF-16 code units, with null path compared as an empty string. Findings differing only in category, target or other unexamined fields can compare equal; stable caller sorting preserves their prior order.
 *
 * @evidence contracts/common.md#principled-implementation The shared code-unit comparator avoids locale-dependent order. Build and race-result sorters pass complete diagnostic records; this comparator orders selected fields rather than supplying a unique full-record identity.
 * @evidence contracts/common.md#clear-and-simple-design One comparison policy serves timed/library findings and input-race results without changing their severity or payload.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null-path coalescing is an ordering convention, not a claim that null and empty paths have equal meaning. No fixture code or message receives a special position.
 * @evidence contracts/common.md#meaningful-documentation Documents key precedence, null-path treatment, code-unit order and ties between records with different omitted fields.
 * @evidence contracts/performance.md#efficient-algorithms One comparison reads at most four string pairs and scales with their common prefixes; caller sorting D findings adds O(D log D) comparisons and its own storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The stateless comparator is shared across sorting phases; it caches no comparison over mutable records and does not own an ordered-result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed findings remain caller-owned and only a scalar result is returned; no handle, retained diagnostic list or task is acquired.
 */
export function compareDiagnostics(
  left: IAutoMovieDiagnostic,
  right: IAutoMovieDiagnostic
): number { return compareCodeUnits(left.phase, right.phase) ||
  compareCodeUnits(left.path ?? "", right.path ?? "") ||
  compareCodeUnits(left.code, right.code) ||
  compareCodeUnits(left.message, right.message); }
