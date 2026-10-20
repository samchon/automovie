import type * as THREE from "three";

import type { IAutoMovieInstanceSetViewerStats } from "./IAutoMovieInstanceSetViewerStats.js";

/**
 * Viewer-owned chunked object for a compiled general instance set.
 *
 * @evidence contracts/common.md#principled-implementation Couples the generated root with current LOD/culling statistics and camera-driven chunk updates, preserving compact compiled instance membership without promoting each slot into a scene node.
 * @evidence contracts/common.md#clear-and-simple-design One handle hides prototype-tier batches and exposes the root and accounting required by a viewer host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runtime represents arbitrary compiled instance sets; authored hidden slots remain distinct from camera-culled slots.
 * @evidence contracts/common.md#meaningful-documentation Documents scene mounting, current accounting, camera-driven visibility recomputation and independent one-shot disposal with failure preservation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This runtime interface selects no culling algorithm; buildInstancedInstanceSet owns chunk and prototype traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The handle defines operations but coordinates no shared request or invalidation itself.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The producer retains chunk meshes and prototype representations until dispose; successful closure clears runtime maps while failed closure retains its actual retirement operations and original failure.
 */
export interface IAutoMovieInstanceSetViewerObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Current LOD and culling accounting. */
  stats: IAutoMovieInstanceSetViewerStats;

  /**
   * Detach and retire instance geometry, prototype geometry and owned material
   * clones once. Borrowed prototype inputs survive. A failure is preserved for
   * repeated callers, and disposed runtimes refuse further updates.
   *
   * @evidence contracts/common.md#principled-implementation Enumerates distinct chunk meshes, geometry and owned prototype material clones before independent retirement, leaving adopted prototype objects and their original materials with the importing host.
   * @evidence contracts/common.md#clear-and-simple-design The runtime handle owns its complete allocation lifetime rather than requiring the host to rediscover hidden prototype representations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Disposal attempts later resources after a throwing listener and preserves the same failure on repeated calls without retrying physical release.
   * @evidence contracts/common.md#meaningful-documentation Names owned release categories, borrowed prototype survival, repeated failure preservation and the post-close update refusal.
   * @evidence contracts/performance.md#efficient-algorithms Set identity deduplication visits chunks, prototypes and materials once; cleanup cost follows allocated batches and representations rather than the original authored slot count.
   * @evidence contracts/performance.md#reuse-equivalent-work A closed-state guard memoizes successful completion or its original failure so repeated disposal never repeats native resource effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful retirement clears root membership and runtime Maps; failed completion retains closing operations with their actual resource references until the host releases this failed owner.
   */
  dispose(): void;

  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence contracts/common.md#principled-implementation Uses the current camera frustum and projected prototype radius to select a hysteretic LOD per chunk/prototype while preserving seeded slot transforms and authored hidden membership.
   * @evidence contracts/common.md#clear-and-simple-design Camera and viewport height are the only per-frame inputs; compiled chunks and instance matrices stay with the owning runtime.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Culling enlarges slot-origin bounds by the supplied set projection-radius estimate times maximum slot scale. The producer must ensure that estimate encloses prototype offsets and depth; the viewer does not independently measure or certify that extent.
   * @evidence contracts/common.md#meaningful-documentation States that this operation recomputes chunk visibility for the supplied camera.
   * @evidence contracts/performance.md#efficient-algorithms Visits chunks and prototype tier meshes without rebuilding member matrices or scanning every slot each frame; fixed camera/frustum temporaries are independent of instance count.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses compiled batches, materials and instance attributes while previous tier selection supplies LOD hysteresis.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Update toggles existing mesh visibility and fixed statistics; it does not acquire an additional GPU resource.
   */
  update(camera: THREE.PerspectiveCamera, viewportHeight: number): void;
}
