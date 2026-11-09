import * as THREE from "three";

/**
 * Synchronize a perspective viewport with its CSS size and selected pixel ratio.
 * The renderer updates its drawing buffer without changing authored CSS layout.
 * The returned function reports a changed raster or projection so the caller can
 * redraw its original producer at the current completed time.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses the native renderer's logical-size/pixel-ratio contract and native perspective aspect/projection update. Positive integer CSS dimensions, finite positive pixel ratio and positive canvas unsigned-long physical extents are admitted before mutation; setDrawingBufferSize changes backing storage without assigning CSS dimensions. Device-specific GPU size limits remain with native renderer admission.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One adapter owns raster/projection synchronization and reports invalidation; mountViewer owns layout observation, original drawing and lifetime.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No camera matrix or foreign renderer method is replaced and no capture raster is silently rescaled; the caller selects a fixed ratio or supplies current device ratio.
 * @evidence contracts/development/common.md#meaningful-documentation States CSS versus backing dimensions, perspective-only scope, admitted units and original-producer redraw responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each call performs fixed-size comparisons and at most one native drawing-buffer resize plus one projection update; unchanged viewport calls allocate no new vector or renderer resource.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses one Vector2 scratch and reads the renderer's actual logical size/pixel ratio, preserving external size changes instead of relying on an independent stale cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only borrowed renderer/camera references and one vector; owns no listener, observer, timer or GPU context. The mounted renderer owns resized native storage and its terminal retirement.
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
