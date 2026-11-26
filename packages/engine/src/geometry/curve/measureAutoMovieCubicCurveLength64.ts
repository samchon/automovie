import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieCurveLengthMeasurement64,
  IAutoMovieCurveLengthQuadrature64,
} from "@automovie/interface";

import { AutoMovieCurveLengthQuadrature64 } from "./AutoMovieCurveLengthQuadrature64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";
import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";

/**
 * Integrate a cubic curve's physical speed with composite eight-point
 * Gauss-Legendre quadrature. Controls use millimetres, so the returned length
 * uses millimetres independently of the curve's phase unit or piece widths.
 * Doubling the subdivisions supplies an observed difference, not an error
 * bound. The original interior-only finite-final policy remains: endpoint-only
 * speed overflow and underflowed contributions do not add admission failures
 * here.
 */
export function measureAutoMovieCubicCurveLength64(
  curve: IAutoMovieCubicBezierCurve64,
  subdivisions: number = 1,
): IAutoMovieCurveLengthMeasurement64 {
  assertAutoMovieCurve64(curve);
  if (subdivisions < 1 || subdivisions > 1024)
    throw new Error("Cubic length subdivisions must be an integer in [1,1024]");
  const measured: IAutoMovieCurveLengthQuadrature64.IMeasureResult =
    AutoMovieCurveLengthQuadrature64.measure(
      curve.spans.map(
        (
          p: AutoMovieCubicBezierControls3,
        ): [
          readonly {
            /**
             * Original finite closed parameter interval, admitted by the
             * caller.
             */
            domain: readonly [number, number];
            /** Original world derivative in mm per interval-parameter unit. */
            derivative: (
              parameter: number,
            ) => readonly [number, number, number];
          }[],
          number,
          boolean,
        ][0][number] => ({
          domain: [0, 1],
          derivative: (t: number): Readonly<AutoMovieVector3Tuple> => {
            const s: number = 1 - t;

            /** The unchanged original Bernstein derivative component in local t. */
            const component: (axis: number) => number = (
              axis: number,
            ): number =>
              3 *
              (s * s * (p[1][axis]! - p[0][axis]!) +
                2 * s * t * (p[2][axis]! - p[1][axis]!) +
                t * t * (p[3][axis]! - p[2][axis]!));
            return [component(0), component(1), component(2)];
          },
        }),
      ),
      subdivisions,
      false,
    );
  if (overflowsBinary64(measured.fineMm) || overflowsBinary64(measured.coarseMm))
    throw new Error("Cubic speed integration overflow");
  return {
    lengthMm: measured.fineMm,
    differenceMm: Math.abs(measured.fineMm - measured.coarseMm),
  };
}
