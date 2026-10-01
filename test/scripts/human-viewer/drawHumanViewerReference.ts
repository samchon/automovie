import type { IHumanViewerReferenceLayer } from "./layoutHumanViewerReference";

/** The 2D drawing surface this module needs, so a test can stand in for a canvas. */
export interface IHumanViewerReferenceContext {
  globalAlpha: number;
  save(): void;
  restore(): void;
  beginPath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
  drawImage(
    image: unknown,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void;
}

/**
 * Draw a reference layout onto a 2D surface, one layer after another. Each
 * layer is isolated by save and restore, so its opacity and clip window never
 * leak into the next layer. The caller supplies the rendered canvas and the
 * decoded photograph and owns the surface; nothing is written anywhere else.
 *
 * @evidence contracts/common.md#principled-implementation Painter's order with per-layer save/restore is the standard canvas composition of alpha and clip.
 * @evidence contracts/common.md#clear-and-simple-design Pure execution of a layout; every decision lives in the layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draws only what the layout names and special-cases no source.
 * @evidence contracts/common.md#meaningful-documentation States the isolation between layers and the ownership of the surface.
 */
export function drawHumanViewerReference(
  context: IHumanViewerReferenceContext,
  layers: readonly IHumanViewerReferenceLayer[],
  images: { render: unknown; photo: unknown },
): void {
  for (const layer of layers) {
    context.save();
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
    context.restore();
  }
}
