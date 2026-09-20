import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports nonfinite material scalars without imposing an unrelated sign restriction.
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Checks normal-map scale finiteness without disallowing the signed values the material contract permits.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Checks normal-map scale finiteness without disallowing the signed values the material contract permits.
 */
export const finiteNumber = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value))
    collector.push("range", path, `${label} must be finite`, value);
};
