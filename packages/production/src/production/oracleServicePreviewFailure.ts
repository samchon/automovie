import { AutoMovieDiagnosticCode, IAutoMoviePreviewFrameOutput } from "@automovie/interface";


/**
 * Construct an uncaptured preview result with its current compile provenance and one render diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation A failure carries null bundle/frame plus the exact supplied compile fingerprint, code and message.
 * @evidence contracts/common.md#clear-and-simple-design Capture refusal assembly is separate from host execution and physical publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No image, receipt or successful frame is fabricated; the caller decides which failures become this result.
 * @evidence contracts/common.md#meaningful-documentation The diagnostic's render phase, preview target and null path identify the operation rather than an inferred artifact.
 * @evidence contracts/performance.md#efficient-algorithms Fixed record/array construction adds no file or pixel traversal; supplied text size contributes to retained output.
 * @evidence contracts/performance.md#reuse-equivalent-work One constructor gives every preview branch the same result shape without caching effectful causes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh result/diagnostic containers; supplied strings are retained with that result only.
 */
export function oracleServicePreviewFailure(
  compileFingerprint: string,
  code: AutoMovieDiagnosticCode,
  message: string
): IAutoMoviePreviewFrameOutput { return ({
  captured: false,
  compileFingerprint,
  renderBundle: null,
  frame: null,
  diagnostics: [
    {
      code,
      category: "error",
      phase: "render",
      target: "preview",
      path: null,
      message,
    },
  ],
}); }
