import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports a nonfinite or below-minimum optical material scalar at the caller's exact path.
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Admits finite optical material values against their caller-owned IOR or thickness lower bound.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Admits finite optical material values against their caller-owned IOR or thickness lower bound.
 */
export const finiteMinimum = (
  value: number,
  minimum: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value) || value < minimum)
    collector.push(
      "range",
      path,
      `${label} must be finite and >= ${minimum}`,
      value,
    );
};
