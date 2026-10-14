import type { IHumanViewerReferenceContext } from "./IHumanViewerReferenceContext.js";
import type { IHumanViewerReferenceLayer } from "./IHumanViewerReferenceLayer.js";

/**
 * Draw supplied reference layers and landmarks on a borrowed 2D surface using shared layout coordinates. Each successful save receives a finally restore attempt even after drawing fails; supported native restore is the premise for recovered state, and a throwing supplied restore can replace the drawing cause. Paths remain canvas-owned and are replaced for clips and markers.
 *
 * @evidence contracts/common.md#principled-implementation Ordered canvas image draws reproduce the shared capture-pixel layout using native alpha and clipping; observed markers draw last in the same pixel frame.
 * @evidence contracts/common.md#clear-and-simple-design Image layers and landmark paths are separate loops; each state-changing drawing scope restores its borrowed canvas state with finally.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function draws caller-supplied images and layout coordinates without subject-specific geometry correction or replacement of canvas methods.
 * @evidence contracts/common.md#meaningful-documentation The comment defines borrowed ownership, shared-layout provenance, layer/marker ordering and state restoration before errors propagate, including the current-path limitation.
 * @evidence contracts/performance.md#efficient-algorithms L layers and M markers require O(L + M) canvas submissions and O(1) auxiliary state; raster work follows destination pixel area in the canvas implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Canvas drawing changes the destination in order; equal source image objects do not make layer effects interchangeable or cacheable here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each successful save has a matching finally restore attempt, including draw/clip/arc failure; supported native canvas restoration is a premise and a throwing supplied restore can replace the primary cause. Canvas/images stay caller-owned.
 */
export function drawHumanViewerReference(
  context: IHumanViewerReferenceContext,
  layers: readonly IHumanViewerReferenceLayer[],
  images: { render: unknown; photo: unknown },
  markers: { x: number; y: number }[] = [],
  markerRadius: number = 2,
): void {
  for (const layer of layers) {
    context.save();
    try {
      context.globalAlpha = layer.alpha;
      if (layer.clip !== null) {
        context.beginPath();
        context.rect(layer.clip.x, layer.clip.y, layer.clip.w, layer.clip.h);
        context.clip();
      }
      context.drawImage(
        images[layer.source],
        layer.box.x,
        layer.box.y,
        layer.box.w,
        layer.box.h,
      );
    } finally {
      context.restore();
    }
  }
  // Landmarks are the last layer, so no photograph or render hides them.
  context.save();
  try {
    context.fillStyle = "#00ffff";
    for (const marker of markers) {
      context.beginPath();
      context.arc(marker.x, marker.y, markerRadius, 0, Math.PI * 2);
      context.fill();
    }
  } finally {
    context.restore();
  }
}
