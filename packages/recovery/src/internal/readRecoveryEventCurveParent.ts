import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieRecoveryEventCurveSource } from "../structures/curve/IAutoMovieRecoveryEventCurveSource";

/**
 * Admit the single complete Bernstein curve supplying an event occurrence.
 * Hermite storage must first pass through the declared basis converter.
 *
 * @evidence contracts/development/implementation.md#principled-implementation One native cubic preserves all four millimetre controls and its positive original phase width.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Occurrence evaluation and compilers share one coefficient owner admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No duplicate net, normalization, epsilon or fallback representation supplies controls.
 * @evidence contracts/development/common.md#meaningful-documentation States the required Bernstein execution basis and preserved original width and units.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed-degree admission checks twelve scalar coefficients.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The original immutable coefficient tuple is returned without copying.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function retains no state or allocated coefficients.
 */
export function readRecoveryEventCurveParent(
  source: IAutoMovieRecoveryEventCurveSource,
): C.Span {
  const curve: IAutoMovieRecoveryEventCurveSource["curve"] = source.curve;
  if (
    !curve ||
    curve.type !== "cubicBezier" ||
    curve.unit !== "mm" ||
    !["turn", "mm", "normalized"].includes(curve.phaseUnit) ||
    curve.spans.length !== 1 ||
    curve.phaseIntervals.length !== 1 ||
    !(curve.phaseIntervals[0]! > 0 && Number.isFinite(curve.phaseIntervals[0]))
  )
    throw new Error(
      "A native event authority requires one millimetre cubic and its original positive phase width",
    );
  const net: C.Span = curve.spans[0]!;
  if (
    !Array.isArray(net) ||
    net.length !== 4 ||
    net.some(
      (point: C.Vector): boolean =>
        !Array.isArray(point) ||
        point.length !== 3 ||
        !point.every(Number.isFinite),
    )
  )
    throw new Error(
      "A native event curve requires four finite millimetre controls",
    );
  return net;
}
