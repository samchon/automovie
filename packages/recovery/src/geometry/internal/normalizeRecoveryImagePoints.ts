import type { IAutoMovieRecoveryImagePointsNormalizationOperation } from "@automovie/interface";

/*
 * Centre matched image points and set their mean Euclidean distance to sqrt(2).
 * Hartley's normalized eight-point construction acts on the original design:
 * https://users.cecs.anu.edu.au/~hartley/Papers/fundamental/fundamental.pdf
 * Coincident or nonrepresentable charts refuse instead of adding an arbitrary
 * spread. This normalization changes a fitting chart, never source pixels.
 */
export function normalizeRecoveryImagePoints(
  points: Parameters<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation> {
  if (points.length === 0)
    throw new Error("camera-design: empty point population");
  let cx: number = 0,
    cy: number = 0;
  for (const point of points) {
    cx += point[0];
    cy += point[1];
  }
  cx /= points.length;
  cy /= points.length;
  let distance: number = 0;
  for (const point of points)
    distance += Math.hypot(point[0] - cx, point[1] - cy);
  distance /= points.length;
  const scale: number = Math.SQRT2 / distance;
  if (
    !(distance > 0) ||
    distance === Infinity ||
    !(scale > 0) ||
    scale === Infinity
  )
    throw new Error(
      "camera-design: coincident or unrepresentable normalization",
    );
  const normalized: [number, number][] = points.map(
    (point: readonly [number, number]): [number, number] => [
      (point[0] - cx) * scale,
      (point[1] - cy) * scale,
    ],
  );
  const transform: number[] = [
    scale,
    0,
    -scale * cx,
    0,
    scale,
    -scale * cy,
    0,
    0,
    1,
  ];
  return { points: normalized, transform };
}
