/** One rectangle in capture pixels, the origin at the top left. */
export interface IHumanViewerReferenceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One layer of the composed capture, drawn in array order. */
export interface IHumanViewerReferenceLayer {
  /** The rendered viewport, or the local reference photograph. */
  source: "render" | "photo";

  /** Destination rectangle, with the photograph already fitted. */
  box: IHumanViewerReferenceBox;

  /** Opacity of this layer, between zero and one. */
  alpha: number;

  /** Visible window inside the destination, or null for all of it. */
  clip: IHumanViewerReferenceBox | null;
}

/**
 * The pixel layout of a capture that shows a reference photograph beside or
 * over the render. The display page draws the photograph as a DOM layer above
 * the canvas, so the canvas alone never contains it. This layout is the same
 * composition in pixels, so a PNG captured for `ref` shows what the page shows.
 * Units are capture pixels. The photograph is fitted inside its square cell
 * without cropping, centred, as CSS `object-fit: contain` places it. `split`
 * widens the capture to two cells with the render left and the photograph
 * right. `overlay` draws the photograph over the render at opacity
 * `1 - opacity`, so `opacity` is the render's share of the mix. `swipe` shows
 * the photograph only right of the `opacity` fraction of the width.
 * The plan reads no image bytes and records no file name or path.
 *
 * @evidence contracts/common.md#principled-implementation Contain-fitting is the uniform scale min(cell/width, cell/height); the other geometry follows from the three closed modes.
 * @evidence contracts/common.md#clear-and-simple-design One pure layout serves the page capture and its unit test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document, photograph or subject is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States why the canvas lacks the photograph, the units and each mode.
 * @evidence contracts/modeling.md#spatial-conventions Capture pixels with a top-left origin; the only conversion is the contain-fit of the photograph into its cell.
 *
 * @param mode Presentation mode.
 * @param size Square cell side in pixels, positive.
 * @param opacity Render share in overlay mode, swipe position in swipe mode, between zero and one.
 * @param photo Natural photograph size in pixels, both positive.
 */
export function layoutHumanViewerReference(
  mode: "split" | "overlay" | "swipe",
  size: number,
  opacity: number,
  photo: { width: number; height: number },
): { width: number; height: number; layers: IHumanViewerReferenceLayer[] } {
  if (!(size > 0) || !(photo.width > 0) || !(photo.height > 0))
    throw new Error("Reference layout needs positive sizes");
  if (!(opacity >= 0 && opacity <= 1))
    throw new Error("Reference opacity must lie between zero and one");
  const scale = Math.min(size / photo.width, size / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  const fitted = (left: number): IHumanViewerReferenceBox => ({
    x: left + (size - w) / 2,
    y: (size - h) / 2,
    w,
    h,
  });
  const cell = { x: 0, y: 0, w: size, h: size };
  const render: IHumanViewerReferenceLayer = {
    source: "render",
    box: cell,
    alpha: 1,
    clip: null,
  };
  if (mode === "split")
    return {
      width: size * 2,
      height: size,
      layers: [
        render,
        { source: "photo", box: fitted(size), alpha: 1, clip: null },
      ],
    };
  if (mode === "overlay")
    return {
      width: size,
      height: size,
      layers: [
        render,
        { source: "photo", box: fitted(0), alpha: 1 - opacity, clip: null },
      ],
    };
  return {
    width: size,
    height: size,
    layers: [
      render,
      {
        source: "photo",
        box: fitted(0),
        alpha: 1,
        clip: { x: size * opacity, y: 0, w: size * (1 - opacity), h: size },
      },
    ],
  };
}
