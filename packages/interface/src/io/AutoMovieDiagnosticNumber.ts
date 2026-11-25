/**
 * JSON-safe representation of an already computed diagnostic quantity. Numeric
 * members are finite, with their original documented units. Sentinels
 * distinguish computed nonfinite values from a separate unavailable null.
 * Diagnostic JSON preserves numerical values, not Float64 signed-zero bits.
 */
export type AutoMovieDiagnosticNumber =
  | number
  | "NaN"
  | "+Infinity"
  | "-Infinity";
