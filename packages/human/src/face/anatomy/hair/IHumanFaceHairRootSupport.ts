import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";

/**
 * The original sampler support around one hair root and its proximity reader.
 *
 * `triangles` are the original resident triangles incident on the root's active support, resolved by `createHumanFaceHairRootBoundary`; `distance` measures unsigned proximity to one of them on the same compiled coordinates. Ray admission lets a root-to-station ray touch only this support.
 *
 * @evidence contracts/common.md#principled-implementation Original incident triangle identities and unsigned proximity identify the root feature on the compiled closed collider.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFaceHairRootBoundary supplies both incidence and triangle-distance reading from one snapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incidence alone cannot classify a crossing or excuse a distant collision; proximity and exterior admission supply those checks.
 * @evidence contracts/common.md#meaningful-documentation triangles are resident ordinals and distance reports metres on those actual triangles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Incidence indexing and lazy triangle query work belong to createHumanFaceHairRootBoundary.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The compiled boundary owns equivalent triangle query reuse; this schema creates no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The owning boundary retains query snapshots; returned triangle lists and their reader remain scoped to that collider.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSupport {
  /** Original resident triangle ordinals incident on the root's support. */
  triangles: readonly number[];

  /** Unsigned distance from a point to one support triangle, in metres. */
  distance: ReturnType<typeof createHumanFaceHairRootBoundary>["distance"];
}
