import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieCubicBezierCurve64,
} from "@automovie/interface";

/**
 * Normalize the saved open-course phase and optionally reverse its declared
 * direction. Physical coefficients remain unchanged; reversing a span reverses
 * its control order and widths together. The last normalized width closes the
 * binary64 prefix exactly.
 */
export function normalizeRecoveryCourse(
  curve: IAutoMovieCubicBezierCurve64,
  reverse: boolean,
): IAutoMovieCubicBezierCurve64 {
  if (
    curve.closed ||
    curve.unit !== "mm" ||
    curve.phaseIntervals.length !== curve.spans.length
  )
    throw new Error("Saved open cubic millimetre authority required");
  const widths: number[] = reverse
    ? [...curve.phaseIntervals].reverse()
    : [...curve.phaseIntervals];
  const total: number = widths.reduce(
    (sum: number, h: number): number => sum + h,
    0,
  );
  if (!(total > 0)) throw new Error("Open curve phase cannot be normalized");
  let prefix: number = 0;
  const phaseIntervals: number[] = widths.map(
    (width: number, i: number): number => {
      const value: number =
        i + 1 === widths.length ? 1 - prefix : width / total;
      if (!(value > 0))
        throw new Error("Normalized open phase interval is not representable");
      prefix += value;
      return value;
    },
  );
  const spans: AutoMovieCubicBezierControls3[] = reverse
    ? [...curve.spans]
        .reverse()
        .map(
          (
            span: AutoMovieCubicBezierControls3,
          ): AutoMovieCubicBezierControls3 => [
            span[3],
            span[2],
            span[1],
            span[0],
          ],
        )
    : [...curve.spans];
  AutoMovieEngineCurve.compileNormalizedPhases64(phaseIntervals, spans.length);
  return {
    ...curve,
    closed: false,
    phaseUnit: "normalized",
    phaseIntervals,
    spans,
  };
}
