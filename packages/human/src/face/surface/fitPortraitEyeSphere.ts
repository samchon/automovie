import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";
import { mean } from "./mean";

/**
 * Fit a spherical cap with an explicit depth-fitting direction. The default
 * uses the canthal plane. Observation-ray fitting retains the rim mean's image
 * position instead of letting uncertain rim depth tilt the centre away from it.
 * Both use the mean rim residual for depth and never consult current gaze.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Fits the globe from the lid aperture without making gaze the anatomical orientation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Selects the canthal-plane or recorded-ray fitting direction, preserves default arithmetic and refuses insufficient spherical support.
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
      (point) => ![point.x, point.y, point.z].every(Number.isFinite),
    ) ||
    Vector3.length(viewRay) === 0
  )
    throw new Error(
      "Eye fitting needs finite lid curves, a viewing direction and a positive radius.",
    );
  const rim = [...lower, ...upper.slice(1, -1).reverse()];
  const center = mean(rim);
  let normal = Vector3.normalize(
    Vector3.cross(
      Vector3.subtract(upper[upper.length - 1], upper[0]),
      Vector3.subtract(mean(upper), mean(lower)),
    ),
  );
  if (Vector3.length(normal) === 0)
    throw new Error("An eye aperture needs a nondegenerate fitting plane.");
  if (alignment === "observation-ray") normal = Vector3.normalize(viewRay);
  if (Vector3.dot(normal, viewRay) < 0) normal = Vector3.scale(normal, -1);
  let depth = 0;
  for (const point of rim) {
    const delta = Vector3.subtract(point, center);
    const height = Vector3.dot(delta, normal);
    const squared = radius ** 2 - Vector3.dot(delta, delta) + height ** 2;
    if (!Number.isFinite(squared) || squared <= 0)
      throw new Error("The selected eye curvature cannot span this aperture.");
    depth += height - Math.sqrt(squared);
  }
  return {
    center: Vector3.add(center, Vector3.scale(normal, depth / rim.length)),
    radius,
  };
}
