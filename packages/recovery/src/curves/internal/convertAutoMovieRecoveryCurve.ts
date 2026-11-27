import { AutoMovieEngineCurveMath64 as M } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryCurveBundle,
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoveryHermiteSpan,
} from "@automovie/interface";

/*
 * Express one saved cubic in the selected coefficient basis. Endpoint
 * derivatives are 3(B1-B0)/h and 3(B3-B2)/h; the inverse handles multiply by
 * h/3, with h the span's original phase width. This is an algebraic basis
 * change in real arithmetic with binary64 rounding, not a fit or a bitwise
 * round trip. Names, closure, units and phase widths are kept, and the spans of
 * the requested basis are fresh records.
 * Parameter curve: The saved cubic, in either basis.
 * Parameter format: The basis to express it in.
 * Returns: The curve in that basis.
 * When the cubic has no span or not one positive phase width
 * per span.
 */
export function convertAutoMovieRecoveryCurve(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
  format: "bezier",
): IAutoMovieCubicBezierCurve64;
export function convertAutoMovieRecoveryCurve(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
  format: "hermite",
): IAutoMovieRecoveryHermiteCurve;
export function convertAutoMovieRecoveryCurve(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
  format: AutoMovieRecoveryCurveFormat,
): IAutoMovieRecoveryCurveBundle.Curve;
export function convertAutoMovieRecoveryCurve(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
  format: AutoMovieRecoveryCurveFormat,
): IAutoMovieRecoveryCurveBundle.Curve {
  if (
    curve.spans.length === 0 ||
    curve.phaseIntervals.length !== curve.spans.length ||
    !curve.phaseIntervals.every((width: number): boolean => width > 0)
  )
    throw new Error(
      "Cubic spans and their original positive phase widths are required",
    );
  return format === "hermite"
    ? { ...curve, type: "cubicHermite", spans: hermiteSpans(curve) }
    : { ...curve, type: "cubicBezier", spans: bezierSpans(curve) };
}

/*
 * A cubic's spans as endpoint jets over each original phase width.
 */
function hermiteSpans(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
): IAutoMovieRecoveryHermiteSpan[] {
  return curve.type === "cubicHermite"
    ? curve.spans.map(
        (
          span: IAutoMovieRecoveryHermiteSpan,
        ): IAutoMovieRecoveryHermiteSpan => ({
          start: M.clone(span.start),
          end: M.clone(span.end),
          startDerivative: M.clone(span.startDerivative),
          endDerivative: M.clone(span.endDerivative),
        }),
      )
    : curve.spans.map(
        (
          span: AutoMovieCubicBezierControls3,
          index: number,
        ): IAutoMovieRecoveryHermiteSpan =>
          M.toHermite(span, curve.phaseIntervals[index]!),
      );
}

/*
 * A cubic's spans as Bernstein controls over each original phase width.
 */
function bezierSpans(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
): AutoMovieCubicBezierControls3[] {
  return curve.type === "cubicBezier"
    ? [...curve.spans]
    : curve.spans.map(
        (
          span: IAutoMovieRecoveryHermiteSpan,
          index: number,
        ): AutoMovieCubicBezierControls3 =>
          M.hermite(
            M.clone(span.start),
            M.clone(span.end),
            M.clone(span.startDerivative),
            M.clone(span.endDerivative),
            curve.phaseIntervals[index]!,
          ),
      );
}
