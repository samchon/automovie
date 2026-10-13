

/**
 * String values use JSON quoting while other unknown values use JavaScript String conversion for diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation String values use JSON quoting while other unknown values use JavaScript String conversion for diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Diagnostic display is independent of declaration admission and does not coerce accepted stage values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It reports the received value without inventing a valid default; custom object conversion can still throw.
 * @evidence contracts/common.md#meaningful-documentation The output is a diagnostic label, not a stable serialization or identity digest.
 * @evidence contracts/performance.md#efficient-algorithms Conversion cost follows string length or the object's conversion method; no graph population is scanned.
 * @evidence contracts/performance.md#reuse-equivalent-work No display result cache is shared because unknown objects can have effectful conversion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string escapes and no diagnostic registry is retained.
 */
export function describeDeclarationValue(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}
