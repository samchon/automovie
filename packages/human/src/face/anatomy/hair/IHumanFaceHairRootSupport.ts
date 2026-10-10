import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";

/**
 * The original sampler support around one hair root and its proximity reader.
 *
 * `triangles` are the original resident triangles incident on the root's
 * active support, resolved by `createHumanFaceHairRootBoundary`; `distance`
 * measures unsigned proximity to one of them on the same compiled coordinates.
 * Ray admission lets a root-to-station ray touch only this support.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSupport {
  /** Original resident triangle ordinals incident on the root's support. */
  triangles: readonly number[];

  /** Unsigned distance from a point to one support triangle, in metres. */
  distance: ReturnType<typeof createHumanFaceHairRootBoundary>["distance"];
}
