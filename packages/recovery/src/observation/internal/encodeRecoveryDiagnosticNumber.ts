import type { AutoMovieDiagnosticNumber } from "@automovie/interface";

/*
 * Encode an already computed number without changing its numerical owner.
 */
export function encodeRecoveryDiagnosticNumber(
  value: number,
): AutoMovieDiagnosticNumber {
  if (Number.isNaN(value)) return "NaN";
  if (value !== Infinity && value !== -Infinity) return value;
  return value > 0 ? "+Infinity" : "-Infinity";
}
