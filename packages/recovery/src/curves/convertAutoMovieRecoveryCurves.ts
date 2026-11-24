import { AutoMovieCurveMath64 as M } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoveryHermiteSpan,
} from "@automovie/interface";

import { rebindRecoveryCurveAuthorities } from "../internal/rebindRecoveryCurveAuthorities";

/**
 * Copy a plain saved recovery artifact into the selected cubic coefficient
 * basis. Every nested cubic occurrence is converted, including open arcs and
 * overrides. Original phase widths, directions, names and metadata survive
 * unchanged. Endpoint derivatives are 3(B1-B0)/h and 3(B3-B2)/h; inverse
 * handles multiply by h/3. This is an algebraic basis change in real
 * arithmetic, with binary64 rounding, not fitting or a bitwise round-trip
 * guarantee. Rational curves requested as Hermite refuse conversion, and a
 * cubic needs as many positive phase widths as spans. Surface nets retain their
 * own representation.
 */
export function convertAutoMovieRecoveryCurves<
  T,
  Format extends AutoMovieRecoveryCurveFormat,
>(input: T, format: Format): AutoMovieRecoveryCurveData<T, Format> {
  if (format !== "bezier" && format !== "hermite")
    throw new Error("Curve format must be bezier or hermite");
  const visit: (value: unknown) => unknown = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (value === null || typeof value !== "object") return value;
    const result: { [key: string]: unknown } = {};
    for (const [key, entry] of Object.entries(value))
      result[key] = visit(entry);
    if (
      format === "hermite" &&
      (result.type === "bernstein" || result.type === "analyticOval")
    )
      throw new Error(
        "Only cubic polynomial curves support this basis selection",
      );
    if (result.type !== "cubicBezier" && result.type !== "cubicHermite")
      return result;
    const curve: IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve =
      result as unknown as
        | IAutoMovieCubicBezierCurve64
        | IAutoMovieRecoveryHermiteCurve;
    if (
      curve.spans.length === 0 ||
      curve.phaseIntervals.length !== curve.spans.length ||
      !curve.phaseIntervals.every((width: number): boolean => width > 0)
    )
      throw new Error(
        "Cubic spans and their original positive phase widths are required",
      );
    const spans: (
      | AutoMovieCubicBezierControls3
      | IAutoMovieRecoveryHermiteSpan
    )[] = curve.spans.map(
      (
        span: AutoMovieCubicBezierControls3 | IAutoMovieRecoveryHermiteSpan,
        index: number,
      ): AutoMovieCubicBezierControls3 | IAutoMovieRecoveryHermiteSpan => {
        const width: number = curve.phaseIntervals[index]!;
        let endpoints: IAutoMovieRecoveryHermiteSpan;
        if (curve.type === "cubicBezier") {
          if (format === "bezier") return span as AutoMovieCubicBezierControls3;
          endpoints = M.toHermite(span as AutoMovieCubicBezierControls3, width);
        } else endpoints = span as IAutoMovieRecoveryHermiteSpan;
        if (format === "hermite") return endpoints;
        return M.hermite(
          M.clone(endpoints.start),
          M.clone(endpoints.end),
          M.clone(endpoints.startDerivative),
          M.clone(endpoints.endDerivative),
          width,
        );
      },
    );
    return {
      ...result,
      type: format === "hermite" ? "cubicHermite" : "cubicBezier",
      spans,
    };
  };
  const result: AutoMovieRecoveryCurveData<T, Format> = visit(
    input,
  ) as AutoMovieRecoveryCurveData<T, Format>;
  rebindRecoveryCurveAuthorities(input, result, format);
  return result;
}
