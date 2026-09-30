import { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Front-facing spherical height, shared by sclera and the visible iris layers.
 *
 * @evidence contracts/common.md#principled-implementation The front hemisphere of a sphere of radius r about (cx,cy,cz) has height z = cz + sqrt(r^2 - dx^2 - dy^2); a sample outside the disc of radius r has no height and is refused.
 * @evidence contracts/common.md#clear-and-simple-design One formula with one refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States that the height is front-facing and shared by the sclera and visible iris layers.
 * @evidence contracts/modeling.md#spatial-conventions The sphere and the sample share the caller's frame (construction millimetres for the portrait eye); nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping portraitEyeSphereHeight is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels portraitEyeSphereHeight defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry portraitEyeSphereHeight decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries portraitEyeSphereHeight constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation portraitEyeSphereHeight owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitEyeSphereHeight carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitEyeSphereHeight admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitEyeSphereHeight defines no input through which a caller shapes a human form.
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
