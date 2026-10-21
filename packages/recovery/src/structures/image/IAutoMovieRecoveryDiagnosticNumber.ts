/**
 * JSON-safe representation of an already computed diagnostic quantity.
 * Numeric members are finite, with their original documented units. Sentinels
 * distinguish computed nonfinite values from a separate unavailable null.
 * Diagnostic JSON preserves numerical values, not Float64 signed-zero bits.
 *
 * @evidence contracts/common.md#principled-implementation Explicit nonfinite sentinels avoid JSON.stringify's implicit conversion to unavailable null without changing the raw numerical predicate.
 * @evidence contracts/common.md#clear-and-simple-design One scalar union serves the fixed feasible diagnostic reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite values are never zero, finite success, unavailable data or a changed gate.
 * @evidence contracts/common.md#meaningful-documentation Defines finite numeric units, exact sentinels, unavailable-state separation and numerical rather than bit-pattern fidelity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar value holds no geometry, array, callback or handle.
 */
export type IAutoMovieRecoveryDiagnosticNumber =
  | number
  | "NaN"
  | "+Infinity"
  | "-Infinity";
