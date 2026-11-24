import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMoviePolylineFit,
  IAutoMoviePolylineFitInput,
  IAutoMovieRecoveryObservationOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";
import { RecoveryBezierFit } from "../internal/RecoveryBezierFit";

/**
 * Fit one caller-ordered polyline through the shared tangent-constrained cubic
 * solver. Closure and correspondence are input facts. The result bounds only
 * the supplied finite polyline, not an unknown continuous surface. Adaptive
 * smooth joins are G1; physical span widths do not imply C1. Hermite conversion
 * retains those widths. Cancellation/progress checkpoints occur before fitting
 * and after basis conversion.
 */
export function observeAutoMovieRecoveryPolyline<
  Format extends AutoMovieRecoveryCurveFormat,
>(
  input: IAutoMoviePolylineFitInput,
  options: Pick<
    IAutoMovieRecoveryObservationOptions<Format>,
    "curveFormat" | "cancelled" | "onProgress"
  >,
): IAutoMovieRecoveryResult<
  AutoMovieRecoveryCurveData<IAutoMoviePolylineFit, Format>
> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "ordered-polyline-v1";
  let cancellationRequested: boolean = false;
  let probe: (() => boolean) | undefined;
  const cancelled: () => boolean = (): boolean => {
    const requested: boolean | undefined = probe?.();
    cancellationRequested = requested === true;
    return cancellationRequested;
  };
  try {
    probe = options.cancelled;

    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before fitting"],
      };
    if (!input.name.trim())
      return {
        operator,
        status: "refused",
        diagnostics: [
          "A named ordered physical polyline, declared closure/corners and supported coefficient basis are required",
        ],
      };

    options.onProgress?.("polyline-fit", 0, 1);
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before fitting"],
      };
    const fit: IAutoMoviePolylineFit = RecoveryBezierFit.fit(input);
    const value: AutoMovieRecoveryCurveData<IAutoMoviePolylineFit, Format> =
      convertAutoMovieRecoveryCurves(fit, options.curveFormat);
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before coefficient return"],
      };
    options.onProgress?.("polyline-fit", 1, 1);
    if (cancelled())
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
      status: cancellationRequested ? "cancelled" : "failed",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}
