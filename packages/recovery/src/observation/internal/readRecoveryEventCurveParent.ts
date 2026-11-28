import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieRecoveryEventCurveSource,
} from "@automovie/interface";

/*
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
    !Number.isFinite(curve.phaseIntervals[0]) ||
    !(curve.phaseIntervals[0]! > 0)
  )
    throw new Error(
      "A native event authority requires one millimetre cubic and its original positive phase width",
    );
  const net: AutoMovieCubicBezierControls3 = curve.spans[0]!;
  const invalid: string =
    "A native event curve requires four finite millimetre controls";
  if (net?.length !== 4) throw new Error(invalid);
  for (const point of net)
    if (
      point?.length !== 3 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1]) ||
      !Number.isFinite(point[2])
    )
      throw new Error(invalid);
  return net;
}
