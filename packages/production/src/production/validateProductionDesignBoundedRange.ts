import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check minimum then maximum against the same inclusive bounds, then report inverted finite endpoints.
 *
 * @evidence contracts/common.md#principled-implementation Neither endpoint is clamped, reordered or repaired.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignBoundedRange owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed bound checks and one ordering comparison add only field-message cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignBoundedRange: (diagnostics: IAutoMovieDiagnostic[], value: { min: number; max: number; }, min: number, max: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: { min: number; max: number },
  min: number,
  max: number,
  target: string,
  file: string,
  field: string,
): void => {
  validateProductionDesignBounded(diagnostics, value.min, min, max, target, file, `${field}.min`);
  validateProductionDesignBounded(diagnostics, value.max, min, max, target, file, `${field}.max`);
  if (
    Number.isFinite(value.min) &&
    Number.isFinite(value.max) &&
    value.min > value.max
  )
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `${field}.min must not exceed ${field}.max. Fix the range in its design setter.`,
    );
};
