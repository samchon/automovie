import { IPortraitLipCoordinate } from "./structures/IPortraitLipCoordinate";

/**
 * One authoritative curved-band sample supplies both normalized coordinates and its skin/oral boundaries. A contour edit must not independently guess the inner Y against which lip thickness is changed. All heights remain in mm.
 *
 * @evidence contracts/common.md#principled-implementation Ordered outer paths and paired inner curves provide one local curved-band coordinate and its authoritative Y boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Section relief and thickness consumers read the same inner boundary instead of separate global-height guesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed curves/corners and inverted local bands refuse; Z is not reconstructed and normalized coordinates alone prove no anatomy.
 * @evidence contracts/common.md#meaningful-documentation Coordinates are millimetres, lateral spans minus one to one and across clamps into the band's unit interval.
 * @evidence contracts/performance.md#efficient-algorithms Preparation copies and scans curves; each sample currently linearly searches four curves by X.
 * @evidence contracts/performance.md#reuse-equivalent-work Owned extracted curves are reused for all coordinate/height reads within this sampler.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure owns copied curves and retains no caller geometry buffers or sample history.
 */
export const createPortraitLipBandSampler: (
  outer: readonly (readonly number[])[],
  upper: readonly (readonly number[])[],
  lower: readonly (readonly number[])[],
) => (point: readonly number[]) => {
  coordinate: IPortraitLipCoordinate;
  innerY: number;
  outerY: number;
} = (
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
      (p: readonly number[]): boolean =>
        p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error("Lip coordinates require finite outer and inner curves.");
  const minimum: number = Math.min(
    ...outer.map((p: readonly number[]): number => p[0]),
  );
  const maximum: number = Math.max(
    ...outer.map((p: readonly number[]): number => p[0]),
  );
  const first: number = outer.findIndex(
    (p: readonly number[]): boolean => p[0] === minimum,
  );
  const last: number = outer.findIndex(
    (p: readonly number[]): boolean => p[0] === maximum,
  );
  const path: (step: number) => number[][] = (step: number): number[][] => {
    const points: number[][] = [[...outer[first]]];
    for (let i: number = first; i !== last; ) {
      i = (i + step + outer.length) % outer.length;
      points.push([...outer[i]]);
    }
    return points;
  };
  const paths: number[][][] = [path(1), path(-1)].sort(
    (a: number[][], b: number[][]): number =>
      b.reduce((sum: number, p: number[]): number => sum + p[1] / b.length, 0) -
      a.reduce((sum: number, p: number[]): number => sum + p[1] / a.length, 0),
  );
  const curves: number[][][] = [
    paths[0],
    paths[1],
    upper.map((p: readonly number[]): number[] => [...p]),
    lower.map((p: readonly number[]): number[] => [...p]),
  ];
  if (
    curves.some(
      (curve: number[][]): boolean =>
        curve.length < 2 ||
        curve.some(
          (p: number[], i: number): boolean => i > 0 && p[0] <= curve[i - 1][0],
        ),
    )
  )
    throw new Error(
      "Lip curves must advance strictly from negative to positive X.",
    );
  const left: number = upper[0][0],
    right: number = upper[upper.length - 1][0];
  if (
    !Number.isFinite(right - left) ||
    upper[0].some((v: number, axis: number): boolean => v !== lower[0][axis]) ||
    upper[upper.length - 1].some(
      (v: number, axis: number): boolean => v !== lower[lower.length - 1][axis],
    ) ||
    minimum > left ||
    maximum < right
  )
    throw new Error(
      "Lip curves must share inner corners inside the outer span.",
    );
  const at: (curve: number[][], x: number) => number = (
    curve: number[][],
    x: number,
  ): number => {
    const edge: number = curve.findIndex((p: number[]): boolean => p[0] >= x);
    if (edge <= 0) return curve[0][1];
    const a: number[] = curve[edge - 1],
      b: number[] = curve[edge];
    // Normalize the segment before subtracting, then interpolate as a convex
    // sum. Large finite coordinates must not overflow intermediate differences.
    const scale: number = Math.max(Math.abs(a[0]), Math.abs(b[0]), 1);
    const t: number =
      (x / scale - a[0] / scale) / (b[0] / scale - a[0] / scale);
    return a[1] * (1 - t) + b[1] * t;
  };
  return (
    point: readonly number[],
  ): {
    coordinate: { side: "upper" | "lower"; lateral: number; across: number };
    innerY: number;
    outerY: number;
  } => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("A lip coordinate sample must be a finite XYZ point.");
    const x: number = Math.max(left, Math.min(right, point[0]));
    const innerTop: number = at(curves[2], x),
      innerBottom: number = at(curves[3], x);
    if (innerTop < innerBottom)
      throw new Error(
        "The upper lip must remain above the lower lip at each section.",
      );
    const side: "upper" | "lower" =
      point[1] >= innerTop / 2 + innerBottom / 2 ? "upper" : "lower";
    const exterior: number = at(curves[side === "upper" ? 0 : 1], x);
    const interior: number = side === "upper" ? innerTop : innerBottom;
    const scale: number = Math.max(
      Math.abs(point[1]),
      Math.abs(exterior),
      Math.abs(interior),
      1,
    );
    const across: number =
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
