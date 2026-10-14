
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Order graph findings by path, then code, then message through the shared code-unit comparator.
 *
 * @evidence contracts/common.md#principled-implementation Lexicographic composition compares path, code and message in that priority using locale-independent code units; the graph's diagnostic sink supplies nonnull paths, and equal three-field keys return zero.
 * @evidence contracts/common.md#clear-and-simple-design The graph coordinator owns sorting its complete array while this comparator owns only the three-key ordering rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture, locale or diagnostic severity changes the ordering, and null paths from arbitrary external diagnostics are outside the actual graph-caller premise.
 * @evidence contracts/common.md#meaningful-documentation States key priority, nonnull-path premise and numeric ordering result; neither diagnostic object is mutated and equal keys need no additional target tie-break.
 * @evidence contracts/performance.md#efficient-algorithms At most three string comparisons per call scale with compared code-unit prefixes; the caller's sort owns array work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each sort comparison reads current key strings; this stateless comparator coordinates no cached or in-flight operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a scalar ordering result escapes; both diagnostic objects remain borrowed without a retained array, handle or task.
 */
export const validateProductionDesignCompareDiagnostics: (left: IAutoMovieDiagnostic, right: IAutoMovieDiagnostic) => number = (
  left: IAutoMovieDiagnostic,
  right: IAutoMovieDiagnostic,
): number =>
  compareCodeUnits(left.path!, right.path!) ||
  compareCodeUnits(left.code, right.code) ||
  compareCodeUnits(left.message, right.message);
