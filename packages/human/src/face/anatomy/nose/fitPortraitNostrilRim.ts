import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import { normalizedRim } from "./normalizedRim";
import { portraitNostrilRimNormal } from "./portraitNostrilRimNormal";

/**
 * Regularize one ordered nasal rim in its own fitted plane. Zero copies the measured boundary; one uses an ellipse whose principal axes and extents come from that boundary. Perimeter progress preserves cyclic vertex ownership, and recentering preserves the original centroid before blending. The operation is independent of head orientation and does not choose a new nasal opening or alter its connectivity. All distances remain millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Normalized boundary plane, principal-axis extents and perimeter progress construct a recentered elliptical blend.
 * @evidence contracts/common.md#clear-and-simple-design Original cyclic vertex identity and centroid survive without choosing a new opening.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roundness is authored regularization rather than inferred nostril shape; zero copies exactly and nonfinite output refuses.
 * @evidence contracts/common.md#meaningful-documentation Input/output coordinates remain millimetres and amount spans zero to one.
 * @evidence contracts/performance.md#efficient-algorithms Longest planar chord search is O(n squared), with remaining projections, covariance and blending linear in rim count.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared normalization/normal owners keep fitting and resizing in one boundary basis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned points are owned copies; normalized/ellipse arrays are per-call temporaries with no source cache.
 */
export function fitPortraitNostrilRim(
  points: number[][],
  amount: number,
): number[][] {
  if (
    points.length < 3 ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 1 ||
    points.some(
      (point: number[]): boolean =>
        point.length !== 3 || !point.every(Number.isFinite),
    )
  )
    throw new Error(
      "Nasal rim fitting needs finite three-dimensional points and a blend in [0,1].",
    );
  if (amount === 0)
    return points.map((point: number[]): number[] => [...point]);
  const {
    scale,
    normalized,
    center,
    local,
  }: {
    scale: number;
    normalized: number[][];
    center: number[];
    local: ImportedIAutoMovieVector3[];
  } = normalizedRim(points);
  const normal: ImportedIAutoMovieVector3 = portraitNostrilRimNormal(local);
  let chord: ImportedIAutoMovieVector3 = Vector3.create(0, 0, 0),
    longest: number = 0;
  for (let i: number = 0; i < local.length; i++)
    for (let j: number = i + 1; j < local.length; j++) {
      const delta: ImportedIAutoMovieVector3 = Vector3.subtract(
        local[j],
        local[i],
      );
      const planar: ImportedIAutoMovieVector3 = Vector3.subtract(
        delta,
        Vector3.scale(normal, Vector3.dot(delta, normal)),
      );
      const length: number = Vector3.length(planar);
      if (length > longest) {
        chord = planar;
        longest = length;
      }
    }
  const u: ImportedIAutoMovieVector3 = Vector3.normalize(chord);
  const v: ImportedIAutoMovieVector3 = Vector3.cross(normal, u);
  const projected: number[][] = local.map(
    (point: ImportedIAutoMovieVector3): number[] => [
      Vector3.dot(point, u),
      Vector3.dot(point, v),
    ],
  );
  let xx: number = 0,
    xy: number = 0,
    yy: number = 0;
  for (const [x, y] of projected) {
    xx += x * x;
    xy += x * y;
    yy += y * y;
  }
  const angle: number = 0.5 * Math.atan2(2 * xy, xx - yy),
    cos: number = Math.cos(angle),
    sin: number = Math.sin(angle);
  const principal: number[][] = projected.map(([x, y]: number[]): number[] => [
    x * cos + y * sin,
    -x * sin + y * cos,
  ]);
  const radiusX: number = Math.max(
    ...principal.map((point: number[]): number => Math.abs(point[0])),
  );
  const radiusY: number = Math.max(
    ...principal.map((point: number[]): number => Math.abs(point[1])),
  );
  const distances: number[] = [0];
  for (let i: number = 0; i < principal.length; i++) {
    const a: number[] = principal[i],
      b: number[] = principal[(i + 1) % principal.length];
    distances.push(distances[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const phase: number = Math.atan2(
    principal[0][1] / radiusY,
    principal[0][0] / radiusX,
  );
  const major: ImportedIAutoMovieVector3 = Vector3.add(
    Vector3.scale(u, cos),
    Vector3.scale(v, sin),
  );
  const minor: ImportedIAutoMovieVector3 = Vector3.add(
    Vector3.scale(u, -sin),
    Vector3.scale(v, cos),
  );
  const ellipse: number[][] = points.map(
    (_point: number[], i: number): number[] => {
      const t: number =
        phase + (2 * Math.PI * distances[i]) / distances[distances.length - 1];
      const point: ImportedIAutoMovieVector3 = Vector3.add(
        Vector3.scale(major, radiusX * Math.cos(t)),
        Vector3.scale(minor, radiusY * Math.sin(t)),
      );
      return [point.x, point.y, point.z];
    },
  );
  const drift: number[] = [0, 1, 2].map(
    (axis: number): number =>
      ellipse.reduce(
        (sum: number, point: number[]): number => sum + point[axis],
        0,
      ) / ellipse.length,
  );
  const output: number[][] = normalized.map(
    (point: number[], i: number): number[] =>
      point.map(
        (value: number, axis: number): number =>
          (value * (1 - amount) +
            amount * (center[axis] + ellipse[i][axis] - drift[axis])) *
          scale,
      ),
  );
  if (output.some((point: number[]): boolean => !point.every(Number.isFinite)))
    throw new Error(
      "The fitted nasal rim exceeds its representable coordinate range.",
    );
  return output;
}
