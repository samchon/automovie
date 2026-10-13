import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports non-string or blank identities without rewriting caller-owned resource names.
 */
export const collectNonEmptyId = (
  value: unknown,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (typeof value !== "string") {
    collector.push("type", path, `${label} must be a string`, value);
    return;
  }
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be a non-empty id`, value);
};
