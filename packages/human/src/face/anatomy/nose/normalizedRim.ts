import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

/**
 * Centre and scale a nostril rim's millimetre points for plane and ellipse fitting.
 *
 * `scale` is the largest absolute coordinate (1 when every coordinate is zero), `normalized` the points divided by it, `center` their mean and `local` the centred vectors. Shared by `fitPortraitNostrilRim` and `resizePortraitNostrilRim` so both fit on the same basis.
 *
 * @evidence contracts/common.md#principled-implementation Largest absolute-coordinate scaling and mean centring prepare a numerical rim basis.
 * @evidence contracts/common.md#clear-and-simple-design Both ellipse fitting and local aperture resizing consume the same normalized coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper has no independent malformed-input admission; callers supply finite XYZ rims and all-zero scale uses the numerical identity convention.
 * @evidence contracts/common.md#meaningful-documentation scale recovers original millimetres while normalized/center/local values are dimensionless.
 * @evidence contracts/performance.md#efficient-algorithms Coordinate flattening and centred-vector generation are linear in rim size.
 * @evidence contracts/performance.md#reuse-equivalent-work One normalization owner prevents fitted-plane basis drift between resize and roundness operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned normalized arrays/vectors are owned and no caller point references or global buffers are retained.
 *
 * @author Samchon
 */
export const normalizedRim: (points: number[][]) => {
  scale: number;
  normalized: number[][];
  center: number[];
  local: ImportedIAutoMovieVector3[];
} = (
  points: number[][],
): {
  scale: number;
  normalized: number[][];
  center: number[];
  local: ImportedIAutoMovieVector3[];
} => {
  const scale: number = Math.max(...points.flat().map(Math.abs)) || 1;
  const normalized: number[][] = points.map((point: number[]): number[] =>
    point.map((value: number): number => value / scale),
  );
  const center: number[] = [0, 1, 2].map(
    (axis: number): number =>
      normalized.reduce(
        (sum: number, point: number[]): number => sum + point[axis],
        0,
      ) / points.length,
  );
  const local: ImportedIAutoMovieVector3[] = normalized.map(
    (point: number[]): ImportedIAutoMovieVector3 =>
      Vector3.create(
        point[0] - center[0],
        point[1] - center[1],
        point[2] - center[2],
      ),
  );
  return { scale, normalized, center, local };
};
