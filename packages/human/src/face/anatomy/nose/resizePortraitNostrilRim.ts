import { Vector3 } from "@automovie/engine";
import { normalizedRim } from "./normalizedRim";
import { rimNormal } from "./rimNormal";

/**
 * Resize a nasal aperture within its own fitted plane, about its centroid.
 * Width follows head X projected into that plane; height is perpendicular to
 * width within the plane. A plane exactly normal to X uses projected head Y as
 * its width guide. Positive factors are dimensionless. Unit factors copy the
 * input exactly, including its depth and nonplanarity.
 *
 * Normal residuals remain unchanged, so sizing does not flatten an irregular
 * rim. Overall nasal width and explicit aperture rotation belong to the caller
 * and run after this local operation. Output stays in the input length unit.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Changes nostril width and height independently of whole-nose dimensions and opening rotation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Scales the aperture in its own normalized plane while retaining normal residuals and copying unit-scale inputs exactly.
 */
export function resizePortraitNostrilRim(
  points: number[][],
  width: number,
  height: number,
): number[][] {
  if (
    points.length < 3 ||
    points.some(
      (point) => point.length !== 3 || !point.every(Number.isFinite),
    ) ||
    ![width, height].every((value) => Number.isFinite(value) && value > 0)
  )
    throw new Error(
      "Nasal aperture sizing needs finite rim points and positive factors.",
    );
  if (width === 1 && height === 1) return points.map((point) => [...point]);
  const { scale, center, local } = normalizedRim(points);
  const normal = rimNormal(local);
  const guide =
    normal.y === 0 && normal.z === 0
      ? Vector3.create(0, 1, 0)
      : Vector3.create(1, 0, 0);
  const across = Vector3.normalize(
    Vector3.subtract(guide, Vector3.scale(normal, Vector3.dot(guide, normal))),
  );
  const along = Vector3.cross(normal, across);
  const output = local.map((point) => {
    const resized = Vector3.add(
      point,
      Vector3.add(
        Vector3.scale(across, (width - 1) * Vector3.dot(point, across)),
        Vector3.scale(along, (height - 1) * Vector3.dot(point, along)),
      ),
    );
    return [resized.x, resized.y, resized.z].map(
      (value, axis) => (center[axis] + value) * scale,
    );
  });
  if (output.some((point) => !point.every(Number.isFinite)))
    throw new Error(
      "The resized nasal rim exceeds its representable coordinate range.",
    );
  return output;
}
