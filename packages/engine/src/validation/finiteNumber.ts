import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports nonfinite material scalars without imposing an unrelated sign restriction.
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
