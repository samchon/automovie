import { IPortraitEyeSphere } from "./IPortraitEyeSphere";

/**
 * Front-facing spherical height, shared by sclera and the visible iris layers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Shares one globe height between visible sclera and iris layers.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Evaluates the anterior spherical surface at head-frame XY and refuses samples outside its finite aperture.
 */
export function portraitEyeSphereHeight(
  sphere: IPortraitEyeSphere,
  x: number,
  y: number,
): number {
  const squared =
    sphere.radius ** 2 -
    (x - sphere.center.x) ** 2 -
    (y - sphere.center.y) ** 2;
  if (!Number.isFinite(squared) || squared < 0)
    throw new Error("Eye surface samples must lie inside the fitted sphere.");
  return sphere.center.z + Math.sqrt(squared);
}
