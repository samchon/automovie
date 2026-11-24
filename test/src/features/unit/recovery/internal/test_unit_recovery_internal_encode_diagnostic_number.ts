import { encodeRecoveryDiagnosticNumber } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `encodeRecoveryDiagnosticNumber` keeps a finite computed number and spells
 * an overflowed one as "+Infinity" or "-Infinity", which JSON cannot carry as
 * a number. Its inputs are computed diagnostics, whose overflow is the case it
 * exists for.
 *
 * Scenarios:
 *
 * 1. 3.5 and −0.25 are kept.
 * 2. An overflowed product, 1e308 × 10, reads "+Infinity", and its negation
 *    "-Infinity".
 */
export function test_unit_recovery_internal_encode_diagnostic_number(): void {
  TestValidator.equals("finite values", [
    encodeRecoveryDiagnosticNumber(3.5),
    encodeRecoveryDiagnosticNumber(-0.25),
  ], [3.5, -0.25]);
  const overflow: number = 1e308 * 10;
  TestValidator.equals("overflowed values", [
    encodeRecoveryDiagnosticNumber(overflow),
    encodeRecoveryDiagnosticNumber(-overflow),
  ], ["+Infinity", "-Infinity"]);
}