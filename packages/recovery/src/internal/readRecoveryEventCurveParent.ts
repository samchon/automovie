import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryEventCurveSource,
} from "@automovie/interface";

/**
 * Admit the single complete Bernstein curve supplying an event occurrence.
 * Hermite storage must first pass through the declared basis converter.
 */
export function readRecoveryEventCurveParent(
  source: IAutoMovieRecoveryEventCurveSource,
): AutoMovieCubicBezierControls3 {
  const curve: IAutoMovieRecoveryEventCurveSource["curve"] = source.curve;
  if (
    !curve ||
    curve.type !== "cubicBezier" ||
    curve.unit !== "mm" ||
    !["turn", "mm", "normalized"].includes(curve.phaseUnit) ||
    curve.spans.length !== 1 ||
    curve.phaseIntervals.length !== 1 ||
    !(curve.phaseIntervals[0]! > 0)
  )
    throw new Error(
      "A native event authority requires one millimetre cubic and its original positive phase width",
    );
  const net: AutoMovieCubicBezierControls3 = curve.spans[0]!;
  if (
    net.length !== 4 ||
    net.some(
      (point: Readonly<AutoMovieVector3Tuple>): boolean => point.length !== 3,
    )
  )
    throw new Error(
      "A native event curve requires four finite millimetre controls",
    );
  return net;
}
