import { AutoMovieContourLoftCurves64 as C } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Sample one declared closed polynomial without leaking a local refusal downstream.
 * An admitted curve retains its exact name and complete phase period. A failed
 * millimetre cubic retains its actual dense finite first endpoint as construction
 * only; an absent or untrusted physical endpoint produces empty construction.
 * Failed metadata is never evaluated again to obtain a period or geometry.
 *
 * @evidence contracts/common.md#principled-implementation The existing Bernstein sampler and affine-rank check own valid boundaries. On refusal, only an explicitly millimetre cubic's existing dense finite endpoint may supply a diagnostic point, never a generated surface.
 * @evidence contracts/common.md#clear-and-simple-design One local owner returns admitted knots, period and a refusal reason so later consumers never dereference failed raw metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fake endpoint, unit inference, positional repair or fallback surface replaces an invalid primitive.
 * @evidence contracts/common.md#meaningful-documentation States endpoint and period authority, empty construction, local failure and unchanged caller coefficients.
 * @evidence contracts/performance.md#efficient-algorithms The existing adaptive sampler dominates work; rank and duplicate-edge checks scan returned knots once. Refusal inspects only the first endpoint and constant-size metadata.
 * @evidence contracts/performance.md#reuse-equivalent-work One sampled knot array feeds shared ring preparation and published construction; failed raw phase metadata is not re-read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Knots and source restrictions transfer to one loft invocation and expire with it; input controls remain caller-owned and no global cache survives.
 */
export function sampleAutoMovieContourRing64(
  curve: IAutoMovieCurve64.Cubic,
  toleranceMm: number,
): {
  name: string;
  knots: C.Knot[];
  period: number;
  unsupported?: string;
} {
  const name: string = typeof curve?.name === "string" ? curve.name : "";
  try {
    const knots: C.Knot[] = C.tessellate(curve, toleranceMm);
    const points: M.V[] = knots.map((knot: C.Knot): M.V => knot.p);
    const period: number = curve.phaseIntervals.reduce(
      (sum: number, width: number): number => sum + width,
      0,
    );
    let unsupported: string | undefined;
    try {
      if (
        !C.hasArea(points) ||
        points.some((point: M.V, i: number): boolean =>
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
    const endpoint: unknown =
      Array.isArray(curve?.spans) && Array.isArray(curve.spans[0])
        ? curve.spans[0][0]
        : undefined;
    const trusted: boolean =
      curve?.type === "cubicBezier" &&
      curve.unit === "mm" &&
      Array.isArray(endpoint) &&
      endpoint.length === 3 &&
      [0, 1, 2].every(
        (axis: number): boolean =>
          Object.hasOwn(endpoint, axis) && Number.isFinite(endpoint[axis]),
      );
    const knots: C.Knot[] =
      trusted && Array.isArray(endpoint)
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
