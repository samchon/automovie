import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";
import { RecoveryBezierFit } from "../internal/RecoveryBezierFit";
import type { IAutoMovieRecoveryCurveFit } from "../structures/curve/IAutoMovieRecoveryCurveFit";
import type { IAutoMovieRecoveryPolylineInput } from "../structures/curve/IAutoMovieRecoveryPolylineInput";
import type { IAutoMovieRecoveryObservationOptions } from "../structures/operation/IAutoMovieRecoveryObservationOptions";
import type { AutoMovieRecoveryCurveData } from "../typings/AutoMovieRecoveryCurveData";
import type { AutoMovieRecoveryCurveFormat } from "../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/**
 * Fit one caller-ordered polyline through the shared tangent-constrained cubic solver.
 * Closure and correspondence are input facts. The result bounds only the supplied
 * finite polyline, not an unknown continuous surface. Adaptive smooth joins are G1;
 * physical span widths do not imply C1. Hermite conversion retains those widths.
 * Cancellation/progress checkpoints occur before fitting and after basis conversion.
 *
 * @evidence contracts/common.md#principled-implementation The maintained Schneider-style two-handle solver owns fitting; the shared converter derives Hermite values with each fitted span's physical parameter width.
 * @evidence contracts/common.md#clear-and-simple-design This public entry admits explicit feature input and delegates numerical fitting and basis conversion without adding another solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-face fallback, inferred point ordering, curve closure, degree reduction or tolerance relaxation is performed.
 * @evidence contracts/common.md#meaningful-documentation States caller correspondence, units, G1 limitation, finite-polyline scope and cooperative checkpoints.
 * @evidence contracts/performance.md#efficient-algorithms For N observations and S spans, delegated fitting costs balanced O(N log S), worst-case O(N squared), with O(N+S) live storage; conversion adds O(S).
 * @evidence contracts/performance.md#reuse-equivalent-work One fit supplies coefficients and diagnostics; one basis conversion supplies the returned coefficient authority without a cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain borrowed; solver copies and conversion maps expire on return or failure, and only source-free coefficients and scalars transfer to the caller.
 */
export function observeAutoMovieRecoveryPolyline<
  Format extends AutoMovieRecoveryCurveFormat,
>(
  input: IAutoMovieRecoveryPolylineInput,
  options: Pick<
    IAutoMovieRecoveryObservationOptions<Format>,
    "curveFormat" | "signal" | "onProgress"
  >,
): IAutoMovieRecoveryResult<
  AutoMovieRecoveryCurveData<IAutoMovieRecoveryCurveFit, Format>
> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "ordered-polyline-v1";
  if (!options)
    return {
      operator,
      status: "refused",
      diagnostics: ["An explicit coefficient basis is required"],
    };
  if (options.signal?.aborted)
    return {
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before fitting"],
    };
  if (
    !input ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    typeof input.closed !== "boolean" ||
    !Array.isArray(input.pointsMm) ||
    !Array.isArray(input.corners) ||
    (options.curveFormat !== "bezier" && options.curveFormat !== "hermite") ||
    (options.onProgress !== undefined &&
      typeof options.onProgress !== "function")
  )
    return {
      operator,
      status: "refused",
      diagnostics: [
        "A named ordered physical polyline, declared closure/corners and supported coefficient basis are required",
      ],
    };
  try {
    options.onProgress?.("polyline-fit", 0, 1);
    if (options.signal?.aborted)
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before fitting"],
      };
    const fit: IAutoMovieRecoveryCurveFit = RecoveryBezierFit.fit(input);
    const value: AutoMovieRecoveryCurveData<
      IAutoMovieRecoveryCurveFit,
      Format
    > = convertAutoMovieRecoveryCurves(fit, options.curveFormat);
    if (options.signal?.aborted)
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before coefficient return"],
      };
    options.onProgress?.("polyline-fit", 1, 1);
    if (options.signal?.aborted)
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before coefficient return"],
      };
    return {
      operator,
      status: fit.toleranceMet ? "complete" : "partial",
      value,
      diagnostics: fit.toleranceMet
        ? []
        : ["The requested finite-polyline tolerance remains unresolved"],
    };
  } catch (error) {
    return {
      operator,
      status: options.signal?.aborted ? "cancelled" : "failed",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}
