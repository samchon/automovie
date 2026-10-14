import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { meanPoint } from "./meanPoint";
import type { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Fit a spherical cap with an explicit depth-fitting direction. The default
 * uses the canthal plane. Observation-ray fitting retains the rim mean's image
 * position instead of letting uncertain rim depth tilt the centre away from it.
 * Both use the mean rim residual for depth and never consult current gaze.
 * Points and radius share a length unit, normally portrait millimetres. Lower
 * samples plus reversed upper interior samples form the rim. Even ray alignment
 * requires a nondegenerate aperture plane; every rim sample must lie strictly
 * inside the chosen radial span. This is an authored cap fit, not clinical
 * globe reconstruction, and extreme accumulation has no final finite guard.
 *
 * @evidence contracts/common.md#principled-implementation The rim centroid anchors transverse position and mean signed spherical residual supplies one depth shift along the selected aperture normal or observation direction.
 * @evidence contracts/common.md#clear-and-simple-design Sample admission, plane selection and residual fitting are one cap owner, using the shared arithmetic mean without consulting gaze or downstream layer geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degenerate planes and nonpositive radial discriminants refuse instead of enlarging the globe; radius is supplied, and clinical reconstruction or extreme finite-accumulation admission is not established.
 * @evidence contracts/common.md#meaningful-documentation Prose gives sample order, unit convention, alignment distinction, required plane/span and the remaining reconstruction/result-admission limits.
 * @evidence contracts/performance.md#efficient-algorithms Admission, rim copying, means and residual accumulation are O(upper plus lower samples), with no iterative solve or mesh-wide fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One fit depends on the current two lid curves, ray, radius and alignment; this helper owns no persistent fitting coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rim references and intermediate vectors live for the call; the returned sphere owns one new centre and retains no sample arrays.
 */
export function fitPortraitEyeSphere(
  upper: IAutoMovieVector3[],
  lower: IAutoMovieVector3[],
  viewRay: IAutoMovieVector3,
  radius: number,
  alignment: "aperture-plane" | "observation-ray" = "aperture-plane",
): IPortraitEyeSphere {
  if (
    (alignment !== "aperture-plane" && alignment !== "observation-ray") ||
    upper.length < 3 ||
    lower.length < 3 ||
    !Number.isFinite(radius) ||
    radius <= 0 ||
    [...upper, ...lower, viewRay].some(
      (point: IAutoMovieVector3): boolean =>
        ![point.x, point.y, point.z].every(Number.isFinite),
    ) ||
    Vector3.length(viewRay) === 0
  )
    throw new Error(
      "Eye fitting needs finite lid curves, a viewing direction and a positive radius.",
    );
  const rim: IAutoMovieVector3[] = [...lower, ...upper.slice(1, -1).reverse()];
  const center: IAutoMovieVector3 = meanPoint(rim);
  let normal: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(
      Vector3.subtract(upper[upper.length - 1], upper[0]),
      Vector3.subtract(meanPoint(upper), meanPoint(lower)),
    ),
  );
  if (Vector3.length(normal) === 0)
    throw new Error("An eye aperture needs a nondegenerate fitting plane.");
  if (alignment === "observation-ray") normal = Vector3.normalize(viewRay);
  if (Vector3.dot(normal, viewRay) < 0) normal = Vector3.scale(normal, -1);
  let depth: number = 0;
  for (const point of rim) {
    const delta: IAutoMovieVector3 = Vector3.subtract(point, center);
    const height: number = Vector3.dot(delta, normal);
    const squared: number =
      radius ** 2 - Vector3.dot(delta, delta) + height ** 2;
    if (!Number.isFinite(squared) || squared <= 0)
      throw new Error("The selected eye curvature cannot span this aperture.");
    depth += height - Math.sqrt(squared);
  }
  return {
    center: Vector3.add(center, Vector3.scale(normal, depth / rim.length)),
    radius,
  };
}
