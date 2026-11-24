import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoftCurves64,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieSampleContourRing64,
} from "@automovie/interface";

import { AutoMovieContourLoftCurves64 as C } from "./AutoMovieContourLoftCurves64";

/**
 * Sample one declared closed polynomial without leaking a local refusal
 * downstream. An admitted curve retains its exact name and complete phase
 * period. A failed millimetre cubic retains its actual dense finite first
 * endpoint as construction only; an absent or untrusted physical endpoint
 * produces empty construction. Failed metadata is never evaluated again to
 * obtain a period or geometry.
 */
export function sampleAutoMovieContourRing64(
  curve: IAutoMovieCubicBezierCurve64,
  toleranceMm: number,
): IAutoMovieSampleContourRing64.IResult {
  const name: string = typeof curve?.name === "string" ? curve.name : "";
  try {
    const knots: IAutoMovieContourLoftCurves64.Knot[] = C.tessellate(
      curve,
      toleranceMm,
    );
    const points: AutoMovieVector3Tuple[] = knots.map(
      (knot: IAutoMovieContourLoftCurves64.Knot): AutoMovieVector3Tuple =>
        knot.p,
    );
    const period: number = curve.phaseIntervals.reduce(
      (sum: number, width: number): number => sum + width,
      0,
    );
    let unsupported: string | undefined;
    try {
      if (
        !C.hasArea(points) ||
        points.some((point: AutoMovieVector3Tuple, i: number): boolean =>
          point.every(
            (value: number, axis: number): boolean =>
              value === points[(i + 1) % points.length][axis],
          ),
        )
      )
        unsupported =
          "Generating closed curve has no noncollapsed two-dimensional sampled boundary";
    } catch (failure: unknown) {
      unsupported = `Generating curve rank unresolved: ${failure instanceof Error ? failure.message : String(failure)}`;
    }
    return {
      name,
      knots,
      period,
      ...(unsupported === undefined ? {} : { unsupported }),
    };
  } catch (failure: unknown) {
    const endpoint: Readonly<AutoMovieVector3Tuple> | undefined =
      curve.type === "cubicBezier" && curve.unit === "mm"
        ? curve.spans[0]?.[0]
        : undefined;
    const knots: IAutoMovieContourLoftCurves64.Knot[] =
      endpoint !== undefined &&
      endpoint.length === 3 &&
      [0, 1, 2].every((axis: number): boolean => Object.hasOwn(endpoint, axis))
        ? [{ p: [endpoint[0], endpoint[1], endpoint[2]], phase: 0 }]
        : [];
    return {
      name,
      knots,
      period: 0,
      unsupported: `Generating curve representation unresolved: ${failure instanceof Error ? failure.message : String(failure)}`,
    };
  }
}
