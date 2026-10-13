import type { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Front-facing spherical height, shared by sclera and the visible iris layers.
 * Coordinates and radius share the caller's unit, normally portrait millimetres.
 * The positive global-Z root includes the zero-discriminant rim and refuses
 * nonfinite or negative squared height. Sphere admission belongs to its owner;
 * the final centre-Z addition has no separate finite-result guard here.
 *
 * @evidence contracts/common.md#principled-implementation Rearranging the sphere equation gives centre Z plus the nonnegative square root; this selects global +Z rather than an arbitrary observation ray.
 * @evidence contracts/common.md#clear-and-simple-design One scalar evaluator supplies spherical layer heights; fitted sphere construction and view-ray intersection have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside-circle samples refuse instead of clamping the discriminant; admitted sphere values and finite final addition remain caller premises.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies the common length unit, +Z branch, admitted rim, refusal and missing final-addition guard.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar arithmetic and one square root use constant time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A height depends on its supplied XY sample; this evaluator owns no requests or repeated phase cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar and retains neither sphere nor coordinates after the call.
 */
export function portraitEyeSphereHeight(
  sphere: IPortraitEyeSphere,
  x: number,
  y: number,
): number {
  const squared: number =
    sphere.radius ** 2 -
    (x - sphere.center.x) ** 2 -
    (y - sphere.center.y) ** 2;
  if (!Number.isFinite(squared) || squared < 0)
    throw new Error("Eye surface samples must lie inside the fitted sphere.");
  return sphere.center.z + Math.sqrt(squared);
}
