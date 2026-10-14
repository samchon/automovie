import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check minimum then maximum against the same inclusive bounds, then report inverted finite endpoints.
 *
 * @evidence contracts/common.md#principled-implementation The shared finite inclusive bound rule checks min then max; a separate ordering comparison runs only for finite endpoints, allowing equal endpoints. Effect and variation callers supply schema-admitted pairs and their domain bounds.
 * @evidence contracts/common.md#clear-and-simple-design Endpoint interval admission stays in the scalar helper; this range wrapper adds only field suffixes and the min-not-above-max relation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation Defines endpoint order, inclusive limits and finite inversion reporting; neither endpoint is reordered and findings append to the caller's array without a returned verdict.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed bound checks and one ordering comparison add only field-message cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Endpoint checks share the supplied bounds and attribution; inversion still compares the current endpoints without reusing an earlier range verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Up to three findings and their correction strings remain in the caller's array; endpoint labels are otherwise temporary and no range object, handle or task is retained.
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
