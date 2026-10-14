import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report whitespace-only declared text with its field address.
 *
 * @evidence contracts/common.md#principled-implementation JavaScript trim tests whether a schema-admitted string contains non-whitespace content and appends one design-text-empty finding when it does not. Identity and descriptive-field callers require nonblank content; this does not judge prose wording or sentence quality.
 * @evidence contracts/common.md#clear-and-simple-design One nonblank-content rule serves identity, description and selector fields while their owners separately check membership and semantic meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Trimming is used only for the test; original text is not rewritten and no expected sentence, keyword or consumer receives an exemption.
 * @evidence contracts/common.md#meaningful-documentation States whitespace-only refusal, caller-attributed field address and appended diagnostic effect; the original string is preserved and no admission verdict is returned.
 * @evidence contracts/performance.md#efficient-algorithms Trimming scans up to the string's code-unit length and can allocate a temporary spelling; an optional finding retains constructed field-address/correction text rather than the supplied value.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each current string is trim-tested directly; no text-validity cache or pending operation is coordinated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trimmed spelling is temporary; at most one finding retains the supplied attribution and constructed field correction in the caller-owned array, without retaining a text history, handle or task.
 */
export const validateProductionDesignText: (diagnostics: IAutoMovieDiagnostic[], value: string, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: string,
  target: string,
  file: string,
  field: string,
): void => {
  if (value.trim().length === 0)
    validateProductionDesignInvalid(
      diagnostics,
      "design-text-empty",
      target,
      file,
      `${field} must contain non-whitespace text. Fix ${field} in its design setter.`,
    );
};
