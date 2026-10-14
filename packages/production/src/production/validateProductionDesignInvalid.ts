import { IAutoMovieDiagnostic, AutoMovieDiagnosticCode } from "@automovie/interface";

/**
 * Append one error-phase design diagnostic with the supplied code, target, path and message.
 *
 * @evidence contracts/common.md#principled-implementation Array.push records supplied code/target/path/message with fixed error category and design phase; validator callers supply a writable ordinary array and already decide whether a finding is required. No previous record is modified or diagnostic schema validated here.
 * @evidence contracts/common.md#clear-and-simple-design One append sink gives all design gates the same category/phase while their field owners retain validation and the coordinator retains sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied findings are appended unchanged in code and attribution; no duplicate suppression, severity downgrade or consumer-specific exemption hides a caller's refusal.
 * @evidence contracts/common.md#meaningful-documentation States the appended record, attribution fields and borrowed-array mutation; this void operation changes no design and does not independently decide admission or promise success if array allocation fails.
 * @evidence contracts/performance.md#efficient-algorithms One record append is amortized constant work excluding caller-supplied text storage.
 * @evidence contracts/performance.md#reuse-equivalent-work All validators append into the supplied current array; this sink adds one actual finding rather than caching or deduplicating prior errors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the new record and borrowed code/target/path/message strings until releasing its array; this helper clears nothing and acquires no handle or task.
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
