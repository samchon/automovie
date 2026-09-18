import { AUTOMOVIE_DIAGNOSTIC_CODES } from "./AUTOMOVIE_DIAGNOSTIC_CODES";

/**
 * One code from the shipped diagnostic catalog.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-code-catalog-reference Prevents producers from emitting codes absent from the enumerable catalog.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-code-catalog-reference Lets catalog construction prove exhaustive code coverage.
 */
export type AutoMovieDiagnosticCode =
  (typeof AUTOMOVIE_DIAGNOSTIC_CODES)[number];
