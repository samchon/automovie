import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report whitespace-only declared text with its field address.
 *
 * @evidence contracts/common.md#principled-implementation This validates schema content required by the design contract, not prose wording, sentence quality or generated expected text.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignText owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms String trimming scales with its code-unit length and the optional finding retains only caller text.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
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
