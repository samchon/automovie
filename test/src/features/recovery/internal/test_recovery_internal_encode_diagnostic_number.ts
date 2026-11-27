import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `encodeRecoveryDiagnosticNumber` keeps a finite computed number and spells an
 * overflowed one as "+Infinity" or "-Infinity", which JSON cannot carry as a
 * number. Its inputs are computed diagnostics, whose overflow is the case it
 * exists for.
 *
 * Scenarios:
 *
 * 1. 3.5 and −0.25 are kept, and so are ±Number.MAX_VALUE and −0.
 * 2. An overflowed product, 1e308 × 10, reads "+Infinity", and its negation
 *    "-Infinity".
 */
export function test_recovery_internal_encode_diagnostic_number(): void {
  TestValidator.equals(
    "finite values",
    [
      AutoMovieRecoveryObservation.encodeDiagnosticNumber(3.5),
      AutoMovieRecoveryObservation.encodeDiagnosticNumber(-0.25),
    ],
    [3.5, -0.25],
  );
  TestValidator.predicate(
    "finite extremes and signed zero are kept",
    AutoMovieRecoveryObservation.encodeDiagnosticNumber(Number.MAX_VALUE) === Number.MAX_VALUE &&
      AutoMovieRecoveryObservation.encodeDiagnosticNumber(-Number.MAX_VALUE) === -Number.MAX_VALUE &&
      Object.is(AutoMovieRecoveryObservation.encodeDiagnosticNumber(-0), -0),
  );
  const overflow: number = 1e308 * 10;
  TestValidator.equals(
    "overflowed values",
    [
      AutoMovieRecoveryObservation.encodeDiagnosticNumber(overflow),
      AutoMovieRecoveryObservation.encodeDiagnosticNumber(-overflow),
    ],
    ["+Infinity", "-Infinity"],
  );
}
