import type { IAutoMovieViewerCameraDepthPrecisionReport } from "./IAutoMovieViewerCameraDepthPrecisionReport.js";
import { evaluateAutoMovieViewerCameraDepthPrecision } from "./evaluateAutoMovieViewerCameraDepthPrecision.js";

/**
 * Refuse a viewer whose observed clips, projection mode or depth bits fail the
 * engine's declared fixed-point capability gate, preserving a passing report.
 *
 * The evaluator checks properties and actual bits, not rendered error or custom
 * shader behavior. Failure includes the status, clips, mode and requested
 * bits.
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
