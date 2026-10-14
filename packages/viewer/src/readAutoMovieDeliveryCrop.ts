import { resolveAutoMovieDeliveryCrop } from "@automovie/engine";
import type { IAutoMovieDeliveryCrop } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Recover the normalized delivery window currently installed on a camera.
 *
 * Population culling and LOD selection run after the camera projection has
 * been installed. Reading the same Three.js view offset keeps those decisions
 * on the delivered window instead of silently reverting to the source gate.
 * A disabled or whole view is returned as omission, matching the public crop
 * contract's geometric no-op.
 *
 * @evidence contracts/common.md#principled-implementation Divides the enabled Three view's offset/extent by its full dimensions, then uses the engine normalized-window validator; camera views must describe a positive finite in-bounds delivery gate and invalid external views throw rather than masquerading as full output.
 * @evidence contracts/common.md#clear-and-simple-design Reads the camera's realized projection state instead of retaining a second crop register, so formation/instance culling consumes the same window as projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabled and exactly whole views map to omission by the crop contract; no scene-id exceptions, approximate edge snapping or foreign method replacement occurs.
 * @evidence contracts/common.md#meaningful-documentation Gives the downstream culling/LOD purpose and disabled/whole-window meaning; arbitrary invalid external view offsets are not repaired.
 * @evidence contracts/performance.md#efficient-algorithms Reads one fixed-size view record and computes four normalized edges with constant time and temporary storage, independent of scene or raster dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the existing camera view directly on each request because mutable offsets/full dimensions can change; no duplicated crop cache or invalidation protocol is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the camera and returns a small portable crop value or omission; retains no camera/GPU handle and launches no task.
 */
export const readAutoMovieDeliveryCrop: (camera: THREE.PerspectiveCamera) => IAutoMovieDeliveryCrop | undefined = (
  camera: THREE.PerspectiveCamera,
): IAutoMovieDeliveryCrop | undefined => {
  const view: THREE.PerspectiveCamera["view"] = camera.view;
  if (view === null || view.enabled === false) return undefined;
  const crop: IAutoMovieDeliveryCrop = resolveAutoMovieDeliveryCrop({
    left: view.offsetX / view.fullWidth,
    top: view.offsetY / view.fullHeight,
    right: (view.offsetX + view.width) / view.fullWidth,
    bottom: (view.offsetY + view.height) / view.fullHeight,
  });
  return crop.left === 0 &&
    crop.top === 0 &&
    crop.right === 1 &&
    crop.bottom === 1
    ? undefined
    : crop;
};
