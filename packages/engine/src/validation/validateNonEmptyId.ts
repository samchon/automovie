import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports non-string or blank identities without rewriting caller-owned resource names.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics Separates non-string and whitespace-only identities while leaving the caller's value unchanged.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation Separates non-string and whitespace-only identities while leaving the caller's value unchanged.
 */
export const validateNonEmptyId = (
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
