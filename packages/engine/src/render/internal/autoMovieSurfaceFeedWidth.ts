import type { IAutoMovieSurfaceGraphicLayer } from "@automovie/interface";

/*
 * Width in pixels of a feed layer's render target: as wide as the layer's box
 * is on the face, at the box's metric aspect, for its `pixels` height.
 *
 * The box spans `width × faceWidth` by `height × faceDepth` metres, so the
 * target is `max(1, round(pixels × width × faceWidth / (height × faceDepth)))`
 * pixels wide; the rounding keeps a whole pixel count and the floor of one
 * keeps a sliver of a box drawable. `render` allocates the target at this width
 * and the render inventory counts it, so both read one rule.
 * Parameter layer: The feed layer, its box in face fractions and its height in
 * pixels.
 * Parameter faceWidth: The surface's width along its frame's `+X`, metres.
 * Parameter faceDepth: The surface's depth along its frame's `Z`, metres.
 * Returns: The target's width, a positive integer.
 */
export function autoMovieSurfaceFeedWidth(
  layer: Pick<
    IAutoMovieSurfaceGraphicLayer.IFeed,
    "pixels" | "width" | "height"
  >,
  faceWidth: number,
  faceDepth: number,
): number {
  return Math.max(
    1,
    Math.round(
      (layer.pixels * layer.width * faceWidth) / (layer.height * faceDepth),
    ),
  );
}
