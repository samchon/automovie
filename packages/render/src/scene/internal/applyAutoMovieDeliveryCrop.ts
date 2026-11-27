import { AutoMovieEngineFilm } from "@automovie/engine";
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
 * offset and projection, while leaving pose and output raster sizing to the
 * host.
 */
export const applyAutoMovieDeliveryCrop: (
  camera: THREE.PerspectiveCamera,
  crop: IAutoMovieDeliveryCrop | undefined,
) => void = (
  camera: THREE.PerspectiveCamera,
  crop: IAutoMovieDeliveryCrop | undefined,
): void => {
  const resolved: IAutoMovieDeliveryCrop = AutoMovieEngineFilm.resolveAutoMovieDeliveryCrop(crop);
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
