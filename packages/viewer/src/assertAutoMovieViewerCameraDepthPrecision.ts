import type { IAutoMovieViewerCameraDepthPrecisionReport } from "./IAutoMovieViewerCameraDepthPrecisionReport.js";
import { evaluateAutoMovieViewerCameraDepthPrecision } from "./evaluateAutoMovieViewerCameraDepthPrecision.js";

/**
 * Refuse a viewer whose observed clips, projection mode or depth bits fail the
 * engine's declared fixed-point capability gate, preserving a passing report.
 *
 * The evaluator checks properties and actual bits, not rendered error or custom
 * shader behavior. Failure includes the status, clips, mode and requested bits.
 *
 * @evidence contracts/common.md#principled-implementation Delegates actual framebuffer/camera admission to the evaluator and throws exactly when its passed flag is false; the same standard-projection and installed-camera premises apply, without extending the gate into a rendered-error measurement.
 * @evidence contracts/common.md#clear-and-simple-design Separates throwing caller policy from the reusable observation/report logic; accepted callers receive the unchanged evaluator report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failure status is downgraded, retried or hidden; diagnostics contain actual report fields rather than substituting requested values or a fixture-specific exception.
 * @evidence contracts/common.md#meaningful-documentation States the refusal policy, preserved passing report, included failure facts and the evaluator's capability-only limitation.
 * @evidence contracts/performance.md#efficient-algorithms Adds one boolean branch and fixed-size diagnostic formatting to the evaluator's single WebGL query and scalar checks; time/space do not grow with scene or raster size.
 * @evidence contracts/performance.md#reuse-equivalent-work Calls the evaluator once and reuses that report for either return or diagnostics; it does not repeat the driver query or store a stale capability cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no renderer or camera after return/throw and acquires no resource/task; the passing scalar report transfers to the caller and failure is a normal Error value.
 */
export const assertAutoMovieViewerCameraDepthPrecision: (
  props: Parameters<typeof evaluateAutoMovieViewerCameraDepthPrecision>[0],
) => IAutoMovieViewerCameraDepthPrecisionReport = (
  props: Parameters<typeof evaluateAutoMovieViewerCameraDepthPrecision>[0],
): IAutoMovieViewerCameraDepthPrecisionReport => {
  const report: IAutoMovieViewerCameraDepthPrecisionReport =
    evaluateAutoMovieViewerCameraDepthPrecision(props);
  if (report.passed === false)
    throw new Error(
      `Camera depth precision refused "${report.camera}": ${report.status}; ` +
        `clip ${String(report.sourceNear)}..${String(report.sourceFar)}m became ` +
        `${String(report.realizedNear)}..${String(report.realizedFar)}m on ` +
        `${report.projection} depth with ${String(report.observedDepthBits)} bits ` +
        `(minimum ${String(report.minimumDepthBits)}).`,
    );
  return report;
};
