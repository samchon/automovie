import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";

/**
 * One authoritative curved-band sample supplies both normalized coordinates and
 * its skin/oral boundaries. A contour edit must not independently guess the
 * inner Y against which lip thickness is changed. All heights remain in mm.
 *
 * @evidence contracts/common.md#principled-implementation Each band is a strip between two curves that advance strictly in X, so its height at any x is a piecewise-linear lookup on each curve, and a point's `across` is its height's position between the outer and inner heights, clamped to [0, 1]; `lateral` is x normalized between the two shared inner corners. The premises (finite points, strictly increasing X, corners shared and inside the outer span, upper above lower) are checked, the segment interpolation is a convex sum and the height ratio is normalized by the largest magnitude so large finite coordinates cannot overflow.
 * @evidence contracts/common.md#clear-and-simple-design One sampler returns the coordinate and both boundary heights together, so callers cannot guess the inner height independently of the coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named: the two outer paths are extracted from the loop's own extreme-X corners and the band is decided against the curved inner centreline, not a fixed head Y.
 * @evidence contracts/common.md#meaningful-documentation The comment states why one sampler supplies the coordinates and the boundary heights, and that all heights are millimetres.
 * @evidence contracts/modeling.md#spatial-conventions Inputs are head-frame millimetre XYZ points; the coordinate is unitless and the heights are millimetres; Z is not inferred.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function samples a strip and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The coordinates and the two boundary heights come from the same curves in one call, so a thickness change that scales about the inner boundary and the skin that follows it are measured against one definition; the curves must share their inner corners inside the outer span or the sampler refuses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint; the bands it measures are observed under the mouth component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; it refuses malformed curves and a lower lip above the upper.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 */
export const createPortraitLipBandSampler = (
  outer: readonly (readonly number[])[],
  upper: readonly (readonly number[])[],
  lower: readonly (readonly number[])[],
): ((point: readonly number[]) => {
  coordinate: IPortraitLipCoordinate;
  innerY: number;
  outerY: number;
}) => {
  if (
    outer.length < 3 ||
    upper.length < 2 ||
    lower.length < 2 ||
    [...outer, ...upper, ...lower].some(
      (p) => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error("Lip coordinates require finite outer and inner curves.");
  const minimum = Math.min(...outer.map((p) => p[0]));
  const maximum = Math.max(...outer.map((p) => p[0]));
  const first = outer.findIndex((p) => p[0] === minimum);
  const last = outer.findIndex((p) => p[0] === maximum);
  const path = (step: number) => {
    const points = [[...outer[first]]];
    for (let i = first; i !== last; ) {
      i = (i + step + outer.length) % outer.length;
      points.push([...outer[i]]);
    }
    return points;
  };
  const paths = [path(1), path(-1)].sort(
    (a, b) =>
      b.reduce((sum, p) => sum + p[1] / b.length, 0) -
      a.reduce((sum, p) => sum + p[1] / a.length, 0),
  );
  const curves = [
    paths[0],
    paths[1],
    upper.map((p) => [...p]),
    lower.map((p) => [...p]),
  ];
  if (
    curves.some(
      (curve) =>
        curve.length < 2 ||
        curve.some((p, i) => i > 0 && p[0] <= curve[i - 1][0]),
    )
  )
    throw new Error(
      "Lip curves must advance strictly from negative to positive X.",
    );
  const left = upper[0][0],
    right = upper[upper.length - 1][0];
  if (
    !Number.isFinite(right - left) ||
    upper[0].some((v, axis) => v !== lower[0][axis]) ||
    upper[upper.length - 1].some(
      (v, axis) => v !== lower[lower.length - 1][axis],
    ) ||
    minimum > left ||
    maximum < right
  )
    throw new Error(
      "Lip curves must share inner corners inside the outer span.",
    );
  const at = (curve: number[][], x: number): number => {
    const edge = curve.findIndex((p) => p[0] >= x);
    if (edge <= 0) return curve[0][1];
    const a = curve[edge - 1],
      b = curve[edge];
    // Normalize the segment before subtracting, then interpolate as a convex
    // sum. Large finite coordinates must not overflow intermediate differences.
    const scale = Math.max(Math.abs(a[0]), Math.abs(b[0]), 1);
    const t = (x / scale - a[0] / scale) / (b[0] / scale - a[0] / scale);
    return a[1] * (1 - t) + b[1] * t;
  };
  return (point) => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("A lip coordinate sample must be a finite XYZ point.");
    const x = Math.max(left, Math.min(right, point[0]));
    const innerTop = at(curves[2], x),
      innerBottom = at(curves[3], x);
    if (innerTop < innerBottom)
      throw new Error(
        "The upper lip must remain above the lower lip at each section.",
      );
    const side = point[1] >= innerTop / 2 + innerBottom / 2 ? "upper" : "lower";
    const exterior = at(curves[side === "upper" ? 0 : 1], x);
    const interior = side === "upper" ? innerTop : innerBottom;
    const scale = Math.max(
      Math.abs(point[1]),
      Math.abs(exterior),
      Math.abs(interior),
      1,
    );
    const across =
      exterior === interior
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              (point[1] / scale - exterior / scale) /
                (interior / scale - exterior / scale),
            ),
          );
    return {
      coordinate: {
        side,
        lateral: 2 * ((x - left) / (right - left)) - 1,
        across,
      },
      innerY: interior,
      outerY: exterior,
    };
  };
};
