import { ViolationCollector } from "./ViolationCollector";

/**
 * Reports repeated model-scoped identities at their original diagnostic paths.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics Retains the first identity and diagnoses subsequent duplicates at their original model paths.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation Retains the first identity and diagnoses subsequent duplicates at their original model paths.
 */
export const validateUniqueValues = (
  entries: ReadonlyArray<readonly [string, string]>,
  label: string,
  collector: ViolationCollector,
): void => {
  const seen = new Set<string>();
  for (const [value, entryPath] of entries) {
    if (seen.has(value))
      collector.push(
        "type",
        entryPath,
        `${label} "${value}" must be unique within the model`,
        value,
      );
    seen.add(value);
  }
};
