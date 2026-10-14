import { IAutoMovieDiagnostic, AutoMovieDiagnosticCode } from "@automovie/interface";

/**
 * Append one error-phase design diagnostic with the supplied code, target, path and message.
 *
 * @evidence contracts/common.md#principled-implementation The caller owns the mutable array and this sink neither throws nor changes prior findings.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignInvalid owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms One record append is amortized constant work excluding caller-supplied text storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignInvalid: (diagnostics: IAutoMovieDiagnostic[], code: AutoMovieDiagnosticCode, target: string, path: string, message: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  code: AutoMovieDiagnosticCode,
  target: string,
  path: string,
  message: string,
): void => {
  diagnostics.push({
    code,
    category: "error",
    phase: "design",
    target,
    path,
    message,
  });
};
