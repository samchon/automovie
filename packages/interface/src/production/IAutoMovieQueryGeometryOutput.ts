import { AutoMovieGeometryQuery } from "./AutoMovieGeometryQuery";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieGeometryResult } from "./IAutoMovieGeometryResult";

/**
 * Current compiled geometry measurement or an attributed query refusal.
 *
 * @evidence contracts/common.md#principled-implementation The production oracle echoes query family and compile identity, delegates measurement to the engine over current generated artifacts and converts missing, stale or unresolvable input into null result with correction diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design One result record keeps measurement and its freshness basis together without embedding compiled scene data or requiring callers to inspect an exception for ordinary refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure is a null result rather than a fabricated zero measurement; compileFingerprint is null only before any successful compile, while stale identity can still be reported with refusal.
 * @evidence contracts/common.md#meaningful-documentation Defines echoed family, nullable compile identity, refused measurement conditions and actionable diagnostics.
 * @author Samchon
 */
export interface IAutoMovieQueryGeometryOutput {
  /** Echoed query family. */
  query: AutoMovieGeometryQuery["query"];

  /** Current compile fingerprint or null before a successful compile. */
  compileFingerprint: string | null;

  /**
   * Engine-derived result, or null when compilation is missing or stale, a selector is ambiguous, or the requested fact cannot be measured.
   */
  result: IAutoMovieGeometryResult | null;

  /** Exact refusal diagnostics and the correction required before retrying. */
  diagnostics: IAutoMovieDiagnostic[];
}
