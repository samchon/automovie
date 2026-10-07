import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";

/**
 * The original sampler support around one hair root and its proximity reader.
 *
 * `triangles` are the original resident triangles incident on the root's
 * active support, resolved by `createHumanFaceHairRootBoundary`; `distance`
 * measures unsigned proximity to one of them on the same compiled coordinates.
 * Ray admission lets a root-to-station ray touch only this support.
 *
 * @evidence contracts/common.md#principled-implementation Bounds the root allowance to the actual incident support instead of a radius around the root.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace a repeated anonymous pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No extra triangle or tolerance widens the allowance.
 * @evidence contracts/common.md#meaningful-documentation States the producer and what the support permits.
 * @evidence contracts/modeling.md#spatial-conventions Distances are head-frame metres on the compiled collider coordinates.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries Names the only skin triangles a hair root may touch.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical topology only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSupport {
  /** Original resident triangle ordinals incident on the root's support. */
  triangles: readonly number[];

  /** Unsigned distance from a point to one support triangle, in metres. */
  distance: ReturnType<typeof createHumanFaceHairRootBoundary>["distance"];
}
