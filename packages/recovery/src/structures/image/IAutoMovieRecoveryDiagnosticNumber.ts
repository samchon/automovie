/**
 * JSON-safe representation of an already computed diagnostic quantity.
 * Numeric members are finite, with their original documented units. Sentinels
 * distinguish computed nonfinite values from a separate unavailable null.
 * Diagnostic JSON preserves numerical values, not Float64 signed-zero bits.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit nonfinite sentinels avoid JSON.stringify's implicit conversion to unavailable null without changing the raw numerical predicate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One scalar union serves the fixed feasible diagnostic reports.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonfinite values are never zero, finite success, unavailable data or a changed gate.
 * @evidence contracts/development/common.md#meaningful-documentation Defines finite numeric units, exact sentinels, unavailable-state separation and numerical rather than bit-pattern fidelity.
 */
export type IAutoMovieRecoveryDiagnosticNumber =
  | number
  | "NaN"
  | "+Infinity"
  | "-Infinity";
