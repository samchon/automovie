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
 *
 *
 * @evidence contracts/common.md#principled-implementation Validate a nonempty finite strictly increasing point list, select endpoint clamps or piecewise-linear interpolation, and use the first authored source when the input is absent.
 * @evidence contracts/common.md#clear-and-simple-design Curve validation and scalar evaluation share one owner; resolveDrivers separately chooses null/absent curve as the linear-range mode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Direct null/malformed curves are refused, while nullable driver curves remain valid linear mode; this helper does not validate source finiteness and extreme intermediate overflow remains a numerical limitation.
 * @evidence contracts/common.md#meaningful-documentation Docs identify nonlinear authored curve admission, missing-source meaning, endpoint saturation and independence from a linear driver's inRange.
 * @evidence contracts/performance.md#efficient-algorithms P points require O(P) validation and at most O(P) segment scan per call with O(1) auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Evaluation reuses borrowed authored points without copying; mutable point contents prevent retaining a validated-result cache solely by array identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one scalar/error escapes; no point copy, channel registry, native handle or task survives evaluation.
 */
export const evaluateDrivenCurve: (
  source: number | undefined,
  curve: IAutoMovieDrivenCurve,
) => number = (
  source: number | undefined,
  curve: IAutoMovieDrivenCurve,
): number => {
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
};

const validateDrivenCurve: (curve: IAutoMovieDrivenCurve) => void = (
  curve: IAutoMovieDrivenCurve,
): void => {
  if (typeof curve !== "object" || curve === null || Array.isArray(curve))
    throw new Error("driven driver curve must be an object");
  if (!Array.isArray(curve.points))
    throw new Error("driven driver curve.points must be an array");
  if (curve.points.length === 0)
    throw new Error(
      "driven driver curve.points must contain at least one point",
    );

  let previousSource: number | null = null;
  for (let i: number = 0; i < curve.points.length; ++i) {
    const point: IAutoMovieDrivenCurvePoint = curve.points[i]!;
    validateDrivenCurvePoint(i, point);
    if (previousSource !== null && point.source <= previousSource)
      throw new Error(
        `driven driver curve.points source values must be strictly increasing, but point ${i} was ${point.source} after ${previousSource}`,
      );
    previousSource = point.source;
  }
};

const validateDrivenCurvePoint: (
  index: number,
  point: IAutoMovieDrivenCurve["points"][number],
) => void = (
  index: number,
  point: IAutoMovieDrivenCurve["points"][number],
): void => {
  if (typeof point !== "object" || point === null || Array.isArray(point))
    throw new Error(
      `driven driver curve.points[${index}] point must be an object`,
    );
  validateDrivenFinite(`curve.points[${index}].source`, point.source);
  validateDrivenFinite(`curve.points[${index}].output`, point.output);
};

const validateDrivenFinite: (label: string, value: number) => void = (
  label: string,
  value: number,
): void => {
  if (!Number.isFinite(value))
    throw new Error(`driven driver ${label} must be finite, but was ${value}`);
};
