import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieGeometryQuery } from "./AutoMovieGeometryQuery";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieGeometryResult } from "./IAutoMovieGeometryResult";

/** Result of one geometry query. */
export interface IAutoMovieQueryGeometryOutput {
  /** Echoed query family. */
  query: AutoMovieGeometryQuery["query"];

  /** Current compile fingerprint or null before a successful compile. */
  compileFingerprint: AutoMovieContentDigest | null;

  /**
   * Engine-derived result, or null when compilation is missing or stale, a
   * selector is ambiguous, or the requested fact cannot be measured.
   */
  result: IAutoMovieGeometryResult | null;

  /** Exact refusal diagnostics and the correction required before retrying. */
  diagnostics: IAutoMovieDiagnostic[];
}
