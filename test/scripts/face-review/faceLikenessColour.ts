/**
 * Colour sampling for the face likeness measurement.
 *
 * `measure-face-likeness.ts` samples the same anatomical regions in the
 * reference photograph and in the render, located by each image's own
 * landmarks: both cheeks, both irises and the visible hair. Pixels are 8-bit
 * sRGB, row-major RGB triples; they are converted to CIELAB (D65 white,
 * IEC 61966-2-1 transfer, CIE 1976 L*a*b*) and each channel's median is
 * reported, which resists specular highlights, eyelashes and stray hair.
 *
 * A photograph's colour is surface reflectance times unknown illumination,
 * white balance and camera response, while the render uses one fixed key and
 * fill. The absolute values are therefore appearance under two different
 * lights, never an albedo estimate. The receipt adds lightness differences
 * relative to the same image's cheek skin (iris minus skin, hair minus skin),
 * which cancel a global exposure change but not a coloured or directional
 * light. Neither is accepted as a skin or iris likeness verdict on its own.
 *
 * Inputs are caller-owned and never mutated.
 */
import {
  type FaceLikenessPoint,
  faceLikenessInterocular,
  faceLikenessMedian,
} from "./faceLikenessGeometry";
import type { IFaceLikenessMask } from "./faceLikenessMasks";

/** Row-major 8-bit sRGB pixels, three bytes per pixel. */
export interface IFaceLikenessImage {
  width: number;
  height: number;
  rgb: Uint8Array;
}

/** Median CIELAB of a sampled region and the number of pixels behind it. */
export interface IFaceLikenessColour {
  lab: [number, number, number];
  pixels: number;
}

/** Subject's right and left cheek centres in the 478-point mesh. */
export const FACE_LIKENESS_CHEEK_POINTS = { right: 205, left: 425 } as const;

/** Eye contours used to keep iris samples inside the open lid aperture. */
export const FACE_LIKENESS_EYE_CONTOURS = {
  right: [
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  ],
  left: [
    263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388,
    466,
  ],
} as const;

/** Iris centre and four rim points of each refined-iris landmark group. */
export const FACE_LIKENESS_IRIS_GROUPS = [
  [468, 469, 470, 471, 472],
  [473, 474, 475, 476, 477],
] as const;

/** Convert one 8-bit sRGB colour to CIELAB under D65. */
export function faceLikenessSrgbToLab(
  red: number,
  green: number,
  blue: number,
): [number, number, number] {
  const linear = (value: number): number => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
  // sRGB primaries to XYZ, normalized by the D65 reference white.
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number): number =>
    t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Median CIELAB of the pixels whose centres satisfy `inside`, skipping pixels
 * set in `exclude`. Returns null when no pixel remains, which the caller
 * records as a missing observation.
 */
export function faceLikenessSampleColour(
  image: IFaceLikenessImage,
  inside: (x: number, y: number) => boolean,
  bounds: { x0: number; y0: number; x1: number; y1: number },
  exclude?: IFaceLikenessMask,
): IFaceLikenessColour | null {
  if (image.rgb.length !== image.width * image.height * 3)
    throw new Error("An image needs three bytes per pixel.");
  if (
    exclude !== undefined &&
    (exclude.width !== image.width || exclude.height !== image.height)
  )
    throw new Error("The exclusion mask must share the image frame.");
  const channels: [number[], number[], number[]] = [[], [], []];
  const x0 = Math.max(0, Math.floor(bounds.x0));
  const y0 = Math.max(0, Math.floor(bounds.y0));
  const x1 = Math.min(image.width, Math.ceil(bounds.x1));
  const y1 = Math.min(image.height, Math.ceil(bounds.y1));
  for (let y = y0; y < y1; ++y)
    for (let x = x0; x < x1; ++x) {
      const index = y * image.width + x;
      if (exclude?.data[index]) continue;
      if (!inside(x + 0.5, y + 0.5)) continue;
      const lab = faceLikenessSrgbToLab(
        image.rgb[3 * index]!,
        image.rgb[3 * index + 1]!,
        image.rgb[3 * index + 2]!,
      );
      for (let c = 0; c < 3; ++c) channels[c]!.push(lab[c]!);
    }
  if (channels[0].length === 0) return null;
  return {
    lab: channels.map((values) => faceLikenessMedian(values)!) as [
      number,
      number,
      number,
    ],
    pixels: channels[0].length,
  };
}

/**
 * Cheek skin of one side: a disc of 0.25 inter-ocular radius at the cheek
 * landmark, excluding hair.
 */
export function faceLikenessCheekColour(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  side: "left" | "right",
  hair?: IFaceLikenessMask,
): IFaceLikenessColour | null {
  const [cx, cy] = points[FACE_LIKENESS_CHEEK_POINTS[side]]!;
  const radius = 0.25 * faceLikenessInterocular(points);
  return faceLikenessSampleColour(
    image,
    (x, y) => Math.hypot(x - cx, y - cy) <= radius,
    { x0: cx - radius, y0: cy - radius, x1: cx + radius, y1: cy + radius },
    hair,
  );
}

/**
 * Iris of one refined-iris group: the annulus between 0.35 and 0.9 of the
 * rim radius (outside the pupil, inside the limbus), restricted to the lid
 * aperture of whichever eye contour contains the iris centre. Null when the
 * centre lies in neither aperture (a closed or undetected eye).
 */
export function faceLikenessIrisColour(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  group: 0 | 1,
): { side: "left" | "right"; colour: IFaceLikenessColour | null } | null {
  const [centre, ...rim] = FACE_LIKENESS_IRIS_GROUPS[group].map(
    (index) => points[index]!,
  );
  const [cx, cy] = centre!;
  const side = (["right", "left"] as const).find((candidate) =>
    faceLikenessInsidePolygon(
      FACE_LIKENESS_EYE_CONTOURS[candidate].map((index) => points[index]!),
      cx,
      cy,
    ),
  );
  if (side === undefined) return null;
  const aperture = FACE_LIKENESS_EYE_CONTOURS[side].map(
    (index) => points[index]!,
  );
  const radius =
    rim.reduce((sum, [x, y]) => sum + Math.hypot(x - cx, y - cy), 0) /
    rim.length;
  return {
    side,
    colour: faceLikenessSampleColour(
      image,
      (x, y) => {
        const r = Math.hypot(x - cx, y - cy);
        return (
          r >= 0.35 * radius &&
          r <= 0.9 * radius &&
          faceLikenessInsidePolygon(aperture, x, y)
        );
      },
      { x0: cx - radius, y0: cy - radius, x1: cx + radius, y1: cy + radius },
    ),
  };
}

/** Median CIELAB of every set hair pixel inside the region. */
export function faceLikenessHairColour(
  image: IFaceLikenessImage,
  hair: IFaceLikenessMask,
  region: { x0: number; y0: number; x1: number; y1: number },
): IFaceLikenessColour | null {
  if (hair.width !== image.width || hair.height !== image.height)
    throw new Error("The hair mask must share the image frame.");
  return faceLikenessSampleColour(
    image,
    (x, y) => hair.data[Math.floor(y) * image.width + Math.floor(x)] !== 0,
    region,
  );
}

/** Even-odd point-in-polygon test. */
export function faceLikenessInsidePolygon(
  polygon: readonly FaceLikenessPoint[],
  x: number,
  y: number,
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
