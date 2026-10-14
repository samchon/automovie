import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import { normalizedRim } from "./normalizedRim";
import { portraitNostrilRimNormal } from "./portraitNostrilRimNormal";

/**
 * Resize a nasal aperture within its own fitted plane, about its centroid. Width follows head X projected into that plane; height is perpendicular to width within the plane. A plane exactly normal to X uses projected head Y as its width guide. Positive factors are dimensionless. Unit factors copy the input exactly, including its depth and nonplanarity.
 *
 * Normal residuals remain unchanged, so sizing does not flatten an irregular rim. Overall nasal width and explicit aperture rotation belong to the caller and run after this local operation. Output stays in the input length unit.
 *
 * @evidence contracts/common.md#principled-implementation Projected head-X and in-plane perpendicular axes scale aperture offsets about the same normalized centroid.
 * @evidence contracts/common.md#clear-and-simple-design Normal residuals and original cyclic identities survive sizing before caller tilt/overall nasal width.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An X-normal plane convention uses projected head Y; malformed factors/rims and nonfinite output refuse without anatomical inference.
 * @evidence contracts/common.md#meaningful-documentation Positive factors are dimensionless and identity copies every original coordinate exactly.
 * @evidence contracts/performance.md#efficient-algorithms Normalization, cyclic normal and offset mapping are linear in rim count.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared normalization and normal owners supply the same fitted basis as roundness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns new point arrays and no caller geometry or persistent work buffer is mutated.
 */
export function resizePortraitNostrilRim(
  points: number[][],
  width: number,
  height: number,
): number[][] {
  if (
    points.length < 3 ||
    points.some(
      (point: number[]): boolean =>
        point.length !== 3 || !point.every(Number.isFinite),
    ) ||
    ![width, height].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error(
      "Nasal aperture sizing needs finite rim points and positive factors.",
    );
  if (width === 1 && height === 1)
    return points.map((point: number[]): number[] => [...point]);
  const {
    scale,
    center,
    local,
  }: {
    scale: number;
    normalized: number[][];
    center: number[];
    local: ImportedIAutoMovieVector3[];
  } = normalizedRim(points);
  const normal: ImportedIAutoMovieVector3 = portraitNostrilRimNormal(local);
  const guide: ImportedIAutoMovieVector3 =
    normal.y === 0 && normal.z === 0
      ? Vector3.create(0, 1, 0)
      : Vector3.create(1, 0, 0);
  const across: ImportedIAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(guide, Vector3.scale(normal, Vector3.dot(guide, normal))),
  );
  const along: ImportedIAutoMovieVector3 = Vector3.cross(normal, across);
  const output: number[][] = local.map(
    (point: ImportedIAutoMovieVector3): number[] => {
      const resized: ImportedIAutoMovieVector3 = Vector3.add(
        point,
        Vector3.add(
          Vector3.scale(across, (width - 1) * Vector3.dot(point, across)),
          Vector3.scale(along, (height - 1) * Vector3.dot(point, along)),
        ),
      );
      return [resized.x, resized.y, resized.z].map(
        (value: number, axis: number): number => (center[axis] + value) * scale,
      );
    },
  );
  if (output.some((point: number[]): boolean => !point.every(Number.isFinite)))
    throw new Error(
      "The resized nasal rim exceeds its representable coordinate range.",
    );
  return output;
}
