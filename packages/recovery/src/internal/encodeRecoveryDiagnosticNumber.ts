import type { AutoMovieDiagnosticNumber } from "@automovie/interface";

/**
 * Encode an already computed number without changing its numerical owner.
 */
export function encodeRecoveryDiagnosticNumber(
  value: number,
): AutoMovieDiagnosticNumber {
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return "NaN";
  return value > 0 ? "+Infinity" : "-Infinity";
}
