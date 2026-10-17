import type { V3 } from "../geometry/V3.ts";
import type { EyeArcPoint } from "./EyeArcPoint.ts";
import type { EyeRadial } from "./EyeRadial.ts";

/**
 * Interpolates one measured polyline at physical arclength, preserving corner directions.
 * Null means the requested station exceeds the observed section. Invalid or
 * degenerate input fails before a caller can mistake an extrapolation for skin.
 *
 * @evidence contracts/common.md#principled-implementation Binary search locates the source segment and linear interpolation evaluates its exact physical arc parameter; one-sided tangents remain separate at a knot.
 * @evidence contracts/common.md#clear-and-simple-design Returns one optional observation; admission and interpolation share the same cumulative source arclength.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not extrapolate or use an identity-specific fallback when coverage is absent.
 * @evidence contracts/common.md#meaningful-documentation Defines null, invalid input, physical units and the source tangent limitation.
 * @evidence contracts/performance.md#efficient-algorithms Validates n knots once per call in O(n), then locates the segment in O(log n); working storage is constant apart from the returned triples.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses caller-supplied cumulative arclength rather than recomputing the path metric.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no input, cache or external handle after returning one observation.
 */
export function sampleEyeArc(
  radial: EyeRadial,
  arcMm: number,
): EyeArcPoint | null {
  const knots: number[] = radial.arcMm;
  const points: V3[] = radial.points;
  if (
    !Number.isFinite(arcMm) ||
    arcMm < 0 ||
    points.length < 2 ||
    points.length !== knots.length ||
    knots[0] !== 0
  )
    throw new Error("Invalid physical eye section parameter");
  for (let index: number = 0; index < points.length; index++) {
    if (
      !Number.isFinite(knots[index]) ||
      points[index].length !== 3 ||
      points[index].some((value: number): boolean => !Number.isFinite(value)) ||
      (index > 0 && knots[index] <= knots[index - 1])
    )
      throw new Error("Invalid eye section observation");
  }
  if (arcMm > knots[knots.length - 1]) return null;
  let low: number = 1;
  let high: number = knots.length - 1;
  while (low < high) {
    const middle: number = (low + high) >> 1;
    if (knots[middle] < arcMm) low = middle + 1;
    else high = middle;
  }
  const start: V3 = points[low - 1];
  const end: V3 = points[low];
  const width: number = knots[low] - knots[low - 1];
  const fraction: number = (arcMm - knots[low - 1]) / width;
  const tangent: V3 = end.map(
    (value: number, coordinate: number): number =>
      (value - start[coordinate]) / width,
  ) as V3;
  const point: V3 = start.map(
    (value: number, coordinate: number): number =>
      value + (end[coordinate] - value) * fraction,
  ) as V3;
  const atKnot: boolean = arcMm === knots[low];
  const outgoing: V3 =
    atKnot && low + 1 < points.length
      ? (points[low + 1].map(
          (value: number, coordinate: number): number =>
            (value - end[coordinate]) / (knots[low + 1] - knots[low]),
        ) as V3)
      : tangent;
  return { p: point, tangentIncoming: tangent, tangentOutgoing: outgoing };
}
