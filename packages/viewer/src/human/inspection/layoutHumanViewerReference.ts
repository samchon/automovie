import type { IHumanViewerReferenceBox } from "./IHumanViewerReferenceBox.js";
import type { IHumanViewerReferenceLayer } from "./IHumanViewerReferenceLayer.js";
import type { IHumanViewerReferenceMarker } from "./IHumanViewerReferenceMarker.js";


/**
 * The pixel layout of a capture that shows a reference photograph beside or over the render. The display page draws the photograph as a DOM layer above the canvas, so the canvas alone never contains it. This layout is the same composition in pixels, so a PNG captured for `ref` shows what the page shows. Units are capture pixels. The photograph is fitted inside its square cell without cropping, centred, as CSS `object-fit: contain` places it. `split` widens the capture to two cells with the render left and the photograph right. `overlay` draws the photograph over the render at opacity `1 - opacity`, so `opacity` is the render's share of the mix. `swipe` shows the photograph only right of the `opacity` fraction of the width. Landmarks are observed on the photograph in unit image coordinates, so each marker lands inside the photograph's fitted box, whichever mode places it. The plan reads no image bytes and records no file name or path.
 *
 * @evidence contracts/common.md#principled-implementation Aspect-preserving contain placement and the declared split/overlay/swipe layer rules derive pixel boxes, clips and photograph-coordinate markers without changing numerical geometry.
 * @evidence contracts/common.md#clear-and-simple-design Shared fitted/place helpers produce one render layer and one photo layer with explicit alpha/clip semantics for each presentation mode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonpositive sizes and out-of-range opacity refuse; only supplied landmark coordinates are projected and image paths/bytes cannot enter the public layout.
 * @evidence contracts/common.md#meaningful-documentation The comment defines capture-pixel units, contain fitting, render-share opacity, swipe clipping and observed unit-image landmark placement.
 * @evidence contracts/performance.md#efficient-algorithms Box/layer work is fixed arithmetic and marker placement traverses supplied landmarks once, without pixel decoding or image sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work The same layout owner serves screen and PNG composition so their fitted coordinates share one calculation rather than separately cached geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two layer descriptions and one marker per supplied landmark remain in the result; no image, canvas or filesystem resource is retained by the planner.
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
  const scale: number = Math.min(size / photo.width, size / photo.height);
  const w: number = photo.width * scale;
  const h: number = photo.height * scale;
  const fitted: (left: number) => IHumanViewerReferenceBox = (left: number): IHumanViewerReferenceBox => ({
    x: left + (size - w) / 2,
    y: (size - h) / 2,
    w,
    h,
  });
  const cell: IHumanViewerReferenceBox = { x: 0, y: 0, w: size, h: size };
  const place: (left: number) => { markers: IHumanViewerReferenceMarker[]; markerRadius: number } = (left: number): { markers: IHumanViewerReferenceMarker[]; markerRadius: number } => {
    const box: IHumanViewerReferenceBox = fitted(left);
    return {
      markers: landmarks.map((point: typeof landmarks[number]): IHumanViewerReferenceMarker => ({
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
