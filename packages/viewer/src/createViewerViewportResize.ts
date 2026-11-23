import * as THREE from "three";

/**
 * Synchronize a perspective viewport with its CSS size and selected pixel
 * ratio. The renderer updates its drawing buffer without changing authored CSS
 * layout. The returned function reports a changed raster or projection so the
 * caller can redraw its original producer at the current completed time.
 */
export function createViewerViewportResize(
  renderer: Pick<
    THREE.WebGLRenderer,
    "getSize" | "getPixelRatio" | "setDrawingBufferSize"
  >,
  camera: THREE.PerspectiveCamera,
): (width: number, height: number, pixelRatio: number) => boolean {
  const size: THREE.Vector2 = new THREE.Vector2();
  return (width: number, height: number, pixelRatio: number): boolean => {
    if (
      !Number.isSafeInteger(width) ||
      width <= 0 ||
      !Number.isSafeInteger(height) ||
      height <= 0 ||
      !Number.isFinite(pixelRatio) ||
      pixelRatio <= 0
    )
      throw new Error(
        "Viewer viewport requires positive integer CSS dimensions and finite positive pixel ratio.",
      );
    if (
      ![Math.floor(width * pixelRatio), Math.floor(height * pixelRatio)].every(
        (extent: number): boolean =>
          Number.isSafeInteger(extent) && extent > 0 && extent <= 0xffffffff,
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
