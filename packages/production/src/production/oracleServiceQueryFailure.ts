import { IAutoMovieDiagnostic, IAutoMovieQueryGeometryOutput } from "@automovie/interface";

/**
 * Pair one geometry diagnostic with a null result and its available compile fingerprint.
 *
 * @evidence contracts/common.md#principled-implementation Exact query identity and available fingerprint accompany the supplied diagnostic without a substitute measurement.
 * @evidence contracts/common.md#clear-and-simple-design The query owner decides the error and this function assembles the common nullable output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null fingerprint denotes no current compile; it does not infer a selector or convert failure to zero geometry.
 * @evidence contracts/common.md#meaningful-documentation The diagnostic object is borrowed in a new one-entry array.
 * @evidence contracts/performance.md#efficient-algorithms Fixed result construction performs no geometry traversal or filesystem work.
 * @evidence contracts/performance.md#reuse-equivalent-work Query refusal branches reuse one representation while each current request retains its own diagnostic.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new output/array and shares the supplied diagnostic for its lifetime.
 */
export function oracleServiceQueryFailure(
  query: IAutoMovieQueryGeometryOutput["query"],
  compileFingerprint: string | null,
  diagnostic: IAutoMovieDiagnostic
): IAutoMovieQueryGeometryOutput { return ({
  query,
  compileFingerprint,
  result: null,
  diagnostics: [diagnostic],
}); }
