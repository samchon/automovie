import type { IHumanViewerReferenceBox } from "./IHumanViewerReferenceBox.js";
import type { IHumanViewerReferenceLayer } from "./IHumanViewerReferenceLayer.js";
import type { IHumanViewerReferenceMarker } from "./IHumanViewerReferenceMarker.js";


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
 * Landmarks are observed on the photograph in unit image coordinates, so each
 * marker lands inside the photograph's fitted box, whichever mode places it.
 * The plan reads no image bytes and records no file name or path.
 *
 * @param mode Presentation mode.
 * @param size Square cell side in pixels, positive.
 * @param opacity Render share in overlay mode, swipe position in swipe mode, between zero and one.
 * @param photo Natural photograph size in pixels, both positive.
 * @param landmarks Observed landmarks in unit image coordinates, empty for none.
 */
export function layoutHumanViewerReference(
  mode: "split" | "overlay" | "swipe",
  size: number,
  opacity: number,
  photo: { width: number; height: number },
  landmarks: readonly { x: number; y: number; group: string }[] = [],
): {
  width: number;
  height: number;
  layers: IHumanViewerReferenceLayer[];
  markers: IHumanViewerReferenceMarker[];
  markerRadius: number;
} {
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
  const place = (left: number) => {
    const box = fitted(left);
    return {
      markers: landmarks.map((point) => ({
        x: box.x + point.x * box.w,
        y: box.y + point.y * box.h,
        group: point.group,
      })),
      markerRadius: Math.max(2, size * 0.004),
    };
  };
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
      ...place(size),
      layers: [
        render,
        { source: "photo", box: fitted(size), alpha: 1, clip: null },
      ],
    };
  if (mode === "overlay")
    return {
      width: size,
      height: size,
      ...place(0),
      layers: [
        render,
        { source: "photo", box: fitted(0), alpha: 1 - opacity, clip: null },
      ],
    };
  return {
    width: size,
    height: size,
    ...place(0),
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
