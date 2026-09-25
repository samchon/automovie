/**
 * Binary-mask comparison for the face likeness measurement.
 *
 * `measure-face-likeness.ts` compares the reference photograph's hair
 * segmentation with the render's visible hair ID pass. The render mask is
 * resampled into the photograph's pixel frame through the landmark
 * similarity (`faceLikenessGeometry.ts`) by nearest-neighbour inverse
 * mapping, so the ID values stay binary. A photograph pixel whose preimage
 * falls outside the render frame is not observed by the render at all; it is
 * returned as uncovered rather than as "no hair", and every IoU is taken only
 * over covered pixels. The caller records the uncovered share of the
 * photograph's hair so a render framed too tightly cannot pass as a match.
 *
 * Masks are caller-owned `Uint8Array`s, row-major, one byte per pixel,
 * non-zero meaning set. Nothing here mutates an input.
 */
import {
  type FaceLikenessPoint,
  type IFaceLikenessSimilarity,
  invertFaceLikenessSimilarity,
} from "./faceLikenessGeometry";

/** A row-major binary mask, non-zero bytes set. */
export interface IFaceLikenessMask {
  width: number;
  height: number;
  data: Uint8Array;
}

/** An axis-aligned pixel rectangle, `x0`/`y0` inclusive, `x1`/`y1` exclusive. */
export interface IFaceLikenessRegion {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Overlap counts over covered pixels; `iou` is null when the union is empty. */
export interface IFaceLikenessOverlap {
  intersection: number;
  union: number;
  reference: number;
  render: number;
  iou: number | null;
}

/**
 * Resample `source` (render pixels) into a `width` by `height` frame
 * (photograph pixels) through `renderToReference`. Returns the warped mask
 * and the coverage mask of photograph pixels whose centre maps inside the
 * render frame.
 */
export function warpFaceLikenessMask(
  source: IFaceLikenessMask,
  renderToReference: IFaceLikenessSimilarity,
  width: number,
  height: number,
): { mask: IFaceLikenessMask; covered: IFaceLikenessMask } {
  assertMask(source);
  const inverse = invertFaceLikenessSimilarity(renderToReference);
  const mask = new Uint8Array(width * height);
  const covered = new Uint8Array(width * height);
  for (let y = 0; y < height; ++y)
    for (let x = 0; x < width; ++x) {
      // Pixel centres map to pixel centres; floor selects the containing texel.
      const cx = x + 0.5;
      const cy = y + 0.5;
      const sx = Math.floor(inverse.a * cx - inverse.b * cy + inverse.tx);
      const sy = Math.floor(inverse.b * cx + inverse.a * cy + inverse.ty);
      if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height)
        continue;
      covered[y * width + x] = 1;
      mask[y * width + x] = source.data[sy * source.width + sx] ? 1 : 0;
    }
  return {
    mask: { width, height, data: mask },
    covered: { width, height, data: covered },
  };
}

/**
 * Count reference/render overlap over pixels that are covered and inside the
 * optional region.
 */
export function faceLikenessMaskOverlap(
  reference: IFaceLikenessMask,
  render: IFaceLikenessMask,
  covered: IFaceLikenessMask,
  region?: IFaceLikenessRegion,
): IFaceLikenessOverlap {
  for (const mask of [reference, render, covered]) {
    assertMask(mask);
    if (mask.width !== reference.width || mask.height !== reference.height)
      throw new Error("Compared masks must share one frame.");
  }
  const { x0, y0, x1, y1 } = region ?? {
    x0: 0,
    y0: 0,
    x1: reference.width,
    y1: reference.height,
  };
  let intersection = 0;
  let union = 0;
  let referenceCount = 0;
  let renderCount = 0;
  for (let y = Math.max(0, y0); y < Math.min(reference.height, y1); ++y)
    for (let x = Math.max(0, x0); x < Math.min(reference.width, x1); ++x) {
      const index = y * reference.width + x;
      if (!covered.data[index]) continue;
      const a = reference.data[index] ? 1 : 0;
      const b = render.data[index] ? 1 : 0;
      intersection += a & b;
      union += a | b;
      referenceCount += a;
      renderCount += b;
    }
  return {
    intersection,
    union,
    reference: referenceCount,
    render: renderCount,
    iou: union === 0 ? null : intersection / union,
  };
}

/**
 * Share of set reference pixels that the render does not cover, or null when
 * the reference mask is empty.
 */
export function faceLikenessUncoveredShare(
  reference: IFaceLikenessMask,
  covered: IFaceLikenessMask,
): number | null {
  let total = 0;
  let uncovered = 0;
  for (let index = 0; index < reference.data.length; ++index) {
    if (!reference.data[index]) continue;
    ++total;
    if (!covered.data[index]) ++uncovered;
  }
  return total === 0 ? null : uncovered / total;
}

/**
 * The head region used for the local hair IoU: the reference landmarks'
 * bounds widened by 0.6 face width on each side, raised by 1.0 face height
 * and lowered by 0.2, clipped to the frame. It keeps the crown and fringe in
 * and most shoulders, clothing and other people out.
 */
export function faceLikenessHeadRegion(
  points: readonly FaceLikenessPoint[],
  width: number,
  height: number,
): IFaceLikenessRegion {
  const bounds = faceLikenessPointBounds(points);
  const faceWidth = bounds.x1 - bounds.x0;
  const faceHeight = bounds.y1 - bounds.y0;
  return {
    x0: Math.max(0, Math.floor(bounds.x0 - 0.6 * faceWidth)),
    y0: Math.max(0, Math.floor(bounds.y0 - 1.0 * faceHeight)),
    x1: Math.min(width, Math.ceil(bounds.x1 + 0.6 * faceWidth)),
    y1: Math.min(height, Math.ceil(bounds.y1 + 0.2 * faceHeight)),
  };
}

/** Real-valued bounds of points (x1/y1 are the maxima). */
export function faceLikenessPointBounds(
  points: readonly FaceLikenessPoint[],
): IFaceLikenessRegion {
  if (points.length === 0) throw new Error("No points to bound.");
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** Pixel bounds of a mask's set pixels, or null for an empty mask. */
export function faceLikenessMaskBounds(
  mask: IFaceLikenessMask,
): IFaceLikenessRegion | null {
  assertMask(mask);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let y = 0; y < mask.height; ++y)
    for (let x = 0; x < mask.width; ++x)
      if (mask.data[y * mask.width + x]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
      }
  return x0 === Infinity ? null : { x0, y0, x1, y1 };
}

function assertMask(mask: IFaceLikenessMask): void {
  if (
    !Number.isInteger(mask.width) ||
    !Number.isInteger(mask.height) ||
    mask.width <= 0 ||
    mask.height <= 0 ||
    mask.data.length !== mask.width * mask.height
  )
    throw new Error(
      "A mask needs positive integer size and one byte per pixel.",
    );
}
