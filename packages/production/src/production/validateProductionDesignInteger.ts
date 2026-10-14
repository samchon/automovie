import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Report values outside the supplied inclusive integer interval.
 *
 * @evidence contracts/common.md#principled-implementation Number.isInteger is the retained rule, while each caller decides whether its bounds require safe integer identity.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignInteger owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Fixed integer/range checks and optional message construction take constant scalar work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignInteger: (diagnostics: IAutoMovieDiagnostic[], value: number, min: number, max: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: number,
  min: number,
  max: number,
  target: string,
  file: string,
  field: string,
): void => {
  if (Number.isInteger(value) === false || value < min || value > max)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `${field} must be an integer from ${min} through ${max}. Fix ${field} in its design setter.`,
    );
};
