import { productionRepaintRawExactText } from "./productionRepaintRawExactText";

/**
 * Convert the raw-family exact-text assertion to false-on-refusal for stored receipt metadata. Admitted text is still not a contained or inspected artifact address.
 *
 * @evidence contracts/common.md#principled-implementation The same exact trimmed/nonempty policy used by planning supplies a boolean through a narrow exception boundary.
 * @evidence contracts/common.md#clear-and-simple-design One text owner supplies both throwing planning admission and predicate receipt admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure becomes false without coercion or replacement text; no path or credential safety claim is introduced.
 * @evidence contracts/common.md#meaningful-documentation Prose states delegated policy, false-on-refusal and locator limitations.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the delegated two-trim text scan plus constant comparison/exception work, with no record traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar wrapper coordinates no repeated raw-output query or value cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caught errors and trim temporaries expire; no caller text or file resource is retained.
 */
export const productionRepaintRawIsExactText: (value: string) => boolean = (value: string): boolean => {
  try {
    return productionRepaintRawExactText(value, "field") === value;
  } catch {
    return false;
  }
};
