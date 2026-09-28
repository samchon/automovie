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
  // Pixels repeat their colours, and the conversion is the costly part.
  const known = new Map<number, [number, number, number]>();
  const x0 = Math.max(0, Math.floor(bounds.x0));
  const y0 = Math.max(0, Math.floor(bounds.y0));
  const x1 = Math.min(image.width, Math.ceil(bounds.x1));
  const y1 = Math.min(image.height, Math.ceil(bounds.y1));
  for (let y = y0; y < y1; ++y)
    for (let x = x0; x < x1; ++x) {
      const index = y * image.width + x;
      if (exclude?.data[index]) continue;
      if (!inside(x + 0.5, y + 0.5)) continue;
      const key =
        (image.rgb[3 * index]! << 16) |
        (image.rgb[3 * index + 1]! << 8) |
        image.rgb[3 * index + 2]!;
      let lab = known.get(key);
      if (lab === undefined) {
        lab = faceLikenessSrgbToLab(
          image.rgb[3 * index]!,
          image.rgb[3 * index + 1]!,
          image.rgb[3 * index + 2]!,
        ) as [number, number, number];
        known.set(key, lab);
      }
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
 * centre lies in neither aperture (a closed or undetected eye); the colour is
 * null when the lids hide more than half of the annulus.
 */
export function faceLikenessIrisColour(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  group: 0 | 1,
): { side: "left" | "right"; colour: IFaceLikenessColour | null } | null {
  const eye = locateEye(points, group);
  if (eye === null) return null;
  const { side, aperture, cx, cy, radius } = eye;
  // An iris the lids hide more than they show is sampled as lid and lash:
  // with less than half of its annulus inside the aperture there is no
  // iris sample (open eyes show 0.53 to 0.89 of it in the population's
  // photographs; a laughing squint 0.18).
  let annulus = 0;
  let seen = 0;
  for (let y = Math.floor(cy - radius); y < Math.ceil(cy + radius); ++y)
    for (let x = Math.floor(cx - radius); x < Math.ceil(cx + radius); ++x) {
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (r < 0.35 * radius || r > 0.9 * radius) continue;
      ++annulus;
      if (faceLikenessInsidePolygon(aperture, x + 0.5, y + 0.5)) ++seen;
    }
  if (annulus === 0 || seen < annulus / 2) return { side, colour: null };
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

/**
 * Sclera beside one refined-iris group: the lid aperture's pixels between
 * 1.15 and 2.2 iris radii from the iris centre. The inner bound stays clear
 * of the limbus; the outer one stops short of the canthi, where the pink
 * caruncle and the lid margins would bias the median. The sclera is the
 * nearest thing to a neutral reflector a portrait carries, so a skin or iris
 * colour divided by it cancels the exposure and illuminant colour of that
 * image. Null when the centre lies in neither aperture.
 */
export function faceLikenessScleraColour(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  group: 0 | 1,
): { side: "left" | "right"; colour: IFaceLikenessColour | null } | null {
  const eye = locateEye(points, group);
  if (eye === null) return null;
  const { side, aperture, cx, cy, radius } = eye;
  return {
    side,
    colour: faceLikenessSampleColour(
      image,
      (x, y) => {
        const r = Math.hypot(x - cx, y - cy);
        return (
          r >= 1.15 * radius &&
          r <= 2.2 * radius &&
          faceLikenessInsidePolygon(aperture, x, y)
        );
      },
      {
        x0: cx - 2.2 * radius,
        y0: cy - 2.2 * radius,
        x1: cx + 2.2 * radius,
        y1: cy + 2.2 * radius,
      },
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

/**
 * The eye whose lid aperture contains a refined-iris group's centre, with
 * that aperture and the iris centre and mean rim radius. Assigning the group
 * by containment keeps a detector's group order from swapping the eyes.
 */
function locateEye(
  points: readonly FaceLikenessPoint[],
  group: 0 | 1,
): {
  side: "left" | "right";
  aperture: FaceLikenessPoint[];
  cx: number;
  cy: number;
  radius: number;
} | null {
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
  return {
    side,
    aperture: FACE_LIKENESS_EYE_CONTOURS[side].map((index) => points[index]!),
    cx,
    cy,
    radius:
      rim.reduce((sum, [x, y]) => sum + Math.hypot(x - cx, y - cy), 0) /
      rim.length,
  };
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

/** Brow outlines (upper edge then lower edge) of the 468-point mesh. */
export const FACE_LIKENESS_BROW_OUTLINES = {
  right: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  left: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
} as const;

/**
 * Brow of one side: the median CIELAB of the darkest `share` (by L*) of the
 * pixels inside the brow outline, hair excluded. With the default tenth it
 * reads a photograph's fibres: a brow is fibres over skin, so its most
 * covered pixels are its darkest for any fibre darker than the skin beneath,
 * and a pale brow reads close to the skin it barely covers. A render is not
 * read that way, because its sharp card texels shade down to near black
 * where a photograph blurs fibre into skin; with `share` 1 the median of the
 * whole outline is the brow's tone as seen, comparable across the two. Null
 * when hair (a fringe) covers more than half of the outline or nothing
 * remains.
 */
export function faceLikenessBrowColour(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  side: "left" | "right",
  hair?: IFaceLikenessMask,
  share = 0.1,
): IFaceLikenessColour | null {
  if (
    hair !== undefined &&
    (hair.width !== image.width || hair.height !== image.height)
  )
    throw new Error("The hair mask must share the image frame.");
  const outline = FACE_LIKENESS_BROW_OUTLINES[side].map(
    (index) => points[index]!,
  );
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const labs: [number, number, number][] = [];
  let inside = 0;
  for (
    let y = Math.max(0, Math.floor(Math.min(...ys)));
    y < Math.min(image.height, Math.ceil(Math.max(...ys)));
    ++y
  )
    for (
      let x = Math.max(0, Math.floor(Math.min(...xs)));
      x < Math.min(image.width, Math.ceil(Math.max(...xs)));
      ++x
    ) {
      if (!faceLikenessInsidePolygon(outline, x + 0.5, y + 0.5)) continue;
      ++inside;
      const index = y * image.width + x;
      if (hair?.data[index]) continue;
      labs.push(
        faceLikenessSrgbToLab(
          image.rgb[3 * index]!,
          image.rgb[3 * index + 1]!,
          image.rgb[3 * index + 2]!,
        ),
      );
    }
  if (labs.length === 0 || labs.length < inside / 2) return null;
  labs.sort((a, b) => a[0] - b[0]);
  const darkest = labs.slice(0, Math.max(1, Math.floor(labs.length * share)));
  return {
    lab: [0, 1, 2].map(
      (c) => faceLikenessMedian(darkest.map((lab) => lab[c]!))!,
    ) as [number, number, number],
    pixels: darkest.length,
  };
}

/**
 * Vermilion of each lip on the 468-point mesh: the outer lip contour from
 * one commissure to the other, then the inner contour back, so the polygon
 * is the red lip between the skin and the lip seam.
 */
export const FACE_LIKENESS_VERMILION = {
  upper: [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312,
    13, 82, 81, 80, 191, 78,
  ],
  lower: [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317,
    14, 87, 178, 88, 95, 78,
  ],
} as const;

/**
 * Vermilion of one lip: the median CIELAB of the pixels inside its outline
 * (`FACE_LIKENESS_VERMILION`). Null when the outline encloses no pixel.
 */
export function faceLikenessLipColour(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
  lip: "upper" | "lower",
): IFaceLikenessColour | null {
  const outline = FACE_LIKENESS_VERMILION[lip].map((index) => points[index]!);
  const ys = outline.map(([, y]) => y);
  // Even-odd spans per pixel row, the same rule as
  // `faceLikenessInsidePolygon`, found once per row rather than per pixel.
  const spans = new Map<number, number[]>();
  const y0 = Math.max(0, Math.floor(Math.min(...ys)));
  const y1 = Math.min(image.height, Math.ceil(Math.max(...ys)));
  for (let row = y0; row < y1; ++row) {
    const y = row + 0.5;
    const crossings: number[] = [];
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const [xi, yi] = outline[i]!;
      const [xj, yj] = outline[j]!;
      if (yi > y !== yj > y)
        crossings.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
    }
    spans.set(
      row,
      crossings.sort((a, b) => a - b),
    );
  }
  const xs = outline.map(([x]) => x);
  return faceLikenessSampleColour(
    image,
    (x, y) => {
      const crossings = spans.get(Math.floor(y));
      if (crossings === undefined) return false;
      let inside = false;
      for (const at of crossings) {
        if (at > x) break;
        inside = !inside;
      }
      return inside;
    },
    {
      x0: Math.min(...xs),
      y0,
      x1: Math.max(...xs),
      y1,
    },
  );
}
