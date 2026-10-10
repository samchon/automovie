import { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Front-facing spherical height, shared by sclera and the visible iris layers.
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
