import { resolveAutoMovieDeliveryCrop } from "@automovie/engine";
import type { IAutoMovieDeliveryCrop } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Apply one normalized delivery crop to a `three.js` perspective camera.
 *
 * The crop is a digital gate window: it changes only the projection matrix,
 * while the renderer keeps the complete output raster. Omission and the whole
 * `0,0,1,1` window clear any prior view offset and reproduce the uncropped
 * projection exactly.
 *
 * The camera must have a finite positive source aspect. This changes its view
 * offset and projection, while leaving pose and output raster sizing to the host.
 *
 * @evidence contracts/common.md#principled-implementation Validates normalized crop edges through the engine resolver, then expresses them in Three's full-view coordinates (aspect by one); whole/omitted windows clear the offset, and positive finite camera aspect is the caller's projection premise.
 * @evidence contracts/common.md#clear-and-simple-design Keeps portable crop admission with the engine and owns only its Three view-offset realization; pose, renderer size and population culling are separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses geometric edges rather than scene names or special raster sizes; invalid crops throw before mutation, with no clamp or substituted camera method.
 * @evidence contracts/common.md#meaningful-documentation Documents normalized gate-window behavior, complete output raster, whole-window reset, camera-aspect premise and which camera fields change.
 * @evidence contracts/performance.md#efficient-algorithms Resolves four edges and updates one fixed-size projection matrix in constant time/space, independent of output pixels or scene population.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the engine resolver; camera projection is recomputed because aspect/fov/clip planes can change independently of an unchanged crop, so no crop-only cache is valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows and mutates one camera without retaining it, acquiring GPU state or scheduling work; Three owns its persistent view-offset record.
 */
export const applyAutoMovieDeliveryCrop: (camera: THREE.PerspectiveCamera, crop: IAutoMovieDeliveryCrop | undefined) => void = (
  camera: THREE.PerspectiveCamera,
  crop: IAutoMovieDeliveryCrop | undefined,
): void => {
  const resolved: IAutoMovieDeliveryCrop = resolveAutoMovieDeliveryCrop(crop);
  if (
    resolved.left === 0 &&
    resolved.top === 0 &&
    resolved.right === 1 &&
    resolved.bottom === 1
  )
    camera.clearViewOffset();
  else {
    const fullWidth: number = camera.aspect;
    camera.setViewOffset(
      fullWidth,
      1,
      resolved.left * fullWidth,
      resolved.top,
      (resolved.right - resolved.left) * fullWidth,
      resolved.bottom - resolved.top,
    );
  }
  camera.updateProjectionMatrix();
};
