import * as THREE from "three";

import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay.js";

/*
 * Synchronize a perspective viewport with its CSS size and selected pixel
 * ratio. The renderer updates its drawing buffer without changing authored CSS
 * layout. The returned function reports a changed raster or projection so the
 * caller can redraw its original producer at the current completed time.
 */
export function createViewerViewportResize(
  request: AutoMovieViewerDisplay.IViewportResizeRequest,
): AutoMovieViewerDisplay.IViewportResizer {
  const { renderer, camera } = request;
  const size: THREE.Vector2 = new THREE.Vector2();
  return (width: number, height: number, pixelRatio: number): boolean => {
    if (width <= 0 || height <= 0 || pixelRatio <= 0)
      throw new Error(
        "Viewer viewport requires positive CSS dimensions and a positive pixel ratio.",
      );
    if (
      ![Math.floor(width * pixelRatio), Math.floor(height * pixelRatio)].every(
        (extent: number): boolean => extent > 0 && extent <= 0xffffffff,
      )
    )
      throw new Error(
        "Viewer drawing-buffer dimensions must fit positive canvas unsigned-long extents.",
      );
    renderer.getSize(size);
    const rasterChanged: boolean =
      size.x !== width ||
      size.y !== height ||
      renderer.getPixelRatio() !== pixelRatio;
    const projectionChanged: boolean = camera.aspect !== width / height;
    if (!rasterChanged && !projectionChanged) return false;
    if (rasterChanged) renderer.setDrawingBufferSize(width, height, pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    return true;
  };
}
