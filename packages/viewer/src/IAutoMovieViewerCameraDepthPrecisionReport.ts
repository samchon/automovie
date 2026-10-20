/**
 * Observable viewer capability result for one resolved production camera.
 *
 * @evidence contracts/common.md#principled-implementation Records declared and realized clip planes, current draw-framebuffer depth bits and standard/log/reversed mode separately; null preserves an unavailable/non-finite observation instead of inventing capability, and passed reflects the evaluator's ordered admission checks.
 * @evidence contracts/common.md#clear-and-simple-design One portable value carries the evaluator result and assertion diagnostics; status distinguishes malformed source, clip mismatch, nonstandard metric and missing/insufficient actual bits without retaining renderer state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports actual queried capability and exact clip equality, with no browser-brand exemption, default bit count or substitution of the requested capability for observation.
 * @evidence contracts/common.md#meaningful-documentation Fields state metres, requested versus observed bits, null meaning, projection variants and the closed status/passed result; this is a capability report, not measured scene-depth error.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report shape performs no query, traversal or numerical evaluation; the evaluator owns those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A returned observation record coordinates no repeated query or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Portable scalar fields own no renderer, framebuffer, GPU allocation or running task.
 */
export interface IAutoMovieViewerCameraDepthPrecisionReport {
  /** Stable resolved camera identity. */
  camera: string;

  /** Authored near distance in camera-space metres, or null when non-finite. */
  sourceNear: number | null;

  /** Authored far distance in camera-space metres, or null when non-finite. */
  sourceFar: number | null;

  /** Near distance installed on the Three camera, or null when non-finite. */
  realizedNear: number | null;

  /** Far distance installed on the Three camera, or null when non-finite. */
  realizedFar: number | null;

  /** Authored minimum fixed-point depth bits, or null when non-finite. */
  minimumDepthBits: number | null;

  /** Current draw framebuffer's `DEPTH_BITS`, or null when non-numeric. */
  observedDepthBits: number | null;

  /** Depth projection mode observed from the renderer. */
  projection: "standard" | "logarithmic" | "reversed" | "logarithmic-reversed";

  /** Closed capability and parity outcome. */
  status:
    | "satisfied"
    | "invalid-source"
    | "projection-mismatch"
    | "nonstandard-projection"
    | "invalid-capability"
    | "insufficient-capability";

  /** Whether clip, projection mode, and depth bits match the declaration. */
  passed: boolean;
}
