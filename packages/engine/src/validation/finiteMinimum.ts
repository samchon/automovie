import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports a nonfinite or below-minimum optical material scalar at the caller's exact path.
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
