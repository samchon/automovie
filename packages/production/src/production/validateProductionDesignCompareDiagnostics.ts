
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Order graph findings by path, then code, then message through the shared code-unit comparator.
 *
 * @evidence contracts/common.md#principled-implementation Graph-produced diagnostics supply nonnull paths; this comparator performs no independent diagnostic schema admission.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignCompareDiagnostics owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms At most three string comparisons per call scale with compared code-unit prefixes; the caller's sort owns array work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignCompareDiagnostics: (left: IAutoMovieDiagnostic, right: IAutoMovieDiagnostic) => number = (
  left: IAutoMovieDiagnostic,
  right: IAutoMovieDiagnostic,
): number =>
  compareCodeUnits(left.path!, right.path!) ||
  compareCodeUnits(left.code, right.code) ||
  compareCodeUnits(left.message, right.message);
