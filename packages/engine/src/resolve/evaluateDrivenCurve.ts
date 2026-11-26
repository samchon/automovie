import {
  IAutoMovieDrivenCurve,
  IAutoMovieDrivenCurvePoint,
} from "@automovie/interface";

/**
 * Evaluate a nonlinear driven-key curve.
 *
 * The curve is validated here because it is authored data crossing the engine
 * boundary. Missing source values default to the first authored source point,
 * so nonlinear curves do not depend on the linear driver's `inRange`.
 */
export function evaluateDrivenCurve(
  source: number | undefined,
  curve: IAutoMovieDrivenCurve,
): number {
  validateDrivenCurve(curve);
  const points: IAutoMovieDrivenCurvePoint[] = curve.points;
  const x: number = source ?? points[0]!.source;
  if (x <= points[0]!.source) return points[0]!.output;
  for (let i: number = 1; i < points.length; ++i) {
    const next: IAutoMovieDrivenCurvePoint = points[i]!;
    if (x <= next.source) {
      const prev: IAutoMovieDrivenCurvePoint = points[i - 1]!;
      return (
        prev.output +
        (next.output - prev.output) *
          ((x - prev.source) / (next.source - prev.source))
      );
    }
  }
  return points[points.length - 1]!.output;
}

const validateDrivenCurve: (curve: IAutoMovieDrivenCurve) => void = (
  curve: IAutoMovieDrivenCurve,
): void => {
  if (curve.points.length === 0)
    throw new Error(
      "driven driver curve.points must contain at least one point",
    );

  let previousSource: number | null = null;
  for (let i: number = 0; i < curve.points.length; ++i) {
    const point: IAutoMovieDrivenCurvePoint = curve.points[i]!;
    if (previousSource !== null && point.source <= previousSource)
      throw new Error(
        `driven driver curve.points source values must be strictly increasing, but point ${i} was ${point.source} after ${previousSource}`,
      );
    previousSource = point.source;
  }
};
