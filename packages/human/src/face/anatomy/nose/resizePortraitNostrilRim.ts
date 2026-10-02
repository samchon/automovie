import { Vector3 } from "@automovie/engine";

import { normalizedRim } from "./normalizedRim";
import { portraitNostrilRimNormal } from "./portraitNostrilRimNormal";

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
 *
 * @evidence contracts/common.md#principled-implementation Scaling each centred point by (factor-1) times its coordinate along two orthonormal in-plane axes (width guided by head X projected into the fitted plane, height perpendicular to it) is a linear map that leaves the plane-normal residual unchanged, so an irregular rim is not flattened; unit factors return an exact copy. The plane comes from the Newell area normal and a plane exactly normal to X falls back to the Y guide, so the axis is always defined.
 * @evidence contracts/common.md#clear-and-simple-design One in-plane linear resize on the shared normalised basis; the overall width and the tilt are left to the component, which owns their order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the result depends on the rim and the two factors.
 * @evidence contracts/common.md#meaningful-documentation The comment states the axes, the fallback guide, the unchanged normal residual and the exact-copy case.
 * @evidence contracts/modeling.md#spatial-conventions Input and output are head millimetres; the factors are dimensionless; the work is done on the normalised basis and rescaled at the end.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nostril aperture owner.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
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
  const normal = portraitNostrilRimNormal(local);
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
