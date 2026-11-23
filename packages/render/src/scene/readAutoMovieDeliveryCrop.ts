import { resolveAutoMovieDeliveryCrop } from "@automovie/engine";
import type { IAutoMovieDeliveryCrop } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Recover the normalized delivery window currently installed on a camera.
 *
 * Population culling and LOD selection run after the camera projection has been
 * installed. Reading the same Three.js view offset keeps those decisions on the
 * delivered window instead of silently reverting to the source gate. A disabled
 * or whole view is returned as omission, matching the public crop contract's
 * geometric no-op.
 */
export const readAutoMovieDeliveryCrop: (
  camera: THREE.PerspectiveCamera,
) => IAutoMovieDeliveryCrop | undefined = (
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
