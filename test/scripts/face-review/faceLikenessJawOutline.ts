/**
 * The jaw's outline read from a portrait's face-skin mask.
 *
 * The face mesh detector places its contour landmarks below the mouth from
 * what the rest of the face predicts: rendered with the chin 25 percent
 * wider, or its height changed by a quarter, the detector's chin contour
 * moved by a percent (README "Instrument"). The face's outline against the
 * neck is nonetheless in the image, and a skin segmentation finds it: the
 * face-skin class of MediaPipe's multiclass selfie segmenter ends at the jaw
 * where the neck's body skin begins, on photographs and on the product's
 * renders alike, and it follows the chin's width and height and the lower
 * face's width as the controls change them.
 *
 * The outline is read in the face's own frame, from detector landmarks the
 * detector does read (README "Instrument"): `across` along the eye line
 * (the eye-corner midpoints), `down` perpendicular to it toward the mouth,
 * distances in inter-ocular units, from stomion (the midpoint of 13 and
 * 14). The face is the mask's 4-connected region holding the nasal tip
 * (landmark 4), so another face in the frame or a hand does not join it.
 * Soft-tissue menton is where that region ends on the midline, found from
 * below (the scan runs up from `REACH` below stomion to the first face
 * pixel), so the mouth's opening, which is not face skin, does not end it
 * early. At each of `FACE_LIKENESS_JAW_LEVELS`, fractions of the way from
 * the mouth line (the cheilia's midpoint, 61 and 291) to menton, the
 * outline's two points are found from outside in along the eye line's
 * direction. A mask without the nasal tip in the face, or a scan that finds
 * no face, yields null.
 *
 * Pure: the mask and points are read, never mutated.
 */
import {
  type FaceLikenessPoint,
  faceLikenessInterocular,
} from "./faceLikenessGeometry";
import type { IFaceLikenessMask } from "./faceLikenessMasks";

/**
 * Outline levels as fractions from the mouth line to menton: the lower
 * face's width at the mouth, the chin's three quarters of the way down.
 */
export const FACE_LIKENESS_JAW_LEVELS = [0, 0.75] as const;

/**
 * The landmark indices the outline is given past the detector's 478 and the
 * two incisal edges: soft-tissue menton, then each level's two points.
 */
export const FACE_LIKENESS_JAW_LANDMARKS = {
  menton: 470,
  levels: [
    [471, 472],
    [473, 474],
  ],
} as const;

/** The jaw's outline in image pixels. */
export interface IFaceLikenessJawOutline {
  menton: FaceLikenessPoint;
  /**
   * At each level, the outline point against `across` (toward the face's
   * right eye) and the one along it.
   */
  levels: [FaceLikenessPoint, FaceLikenessPoint][];
}

/** How far out a scan starts, inter-ocular units. */
const REACH = 1.5;
/** Scan step, inter-ocular units. */
const STEP = 0.002;

/** The outline's points by their landmark indices. */
export function faceLikenessJawLandmarks(
  outline: IFaceLikenessJawOutline,
): [number, FaceLikenessPoint][] {
  return [
    [FACE_LIKENESS_JAW_LANDMARKS.menton, outline.menton],
    ...FACE_LIKENESS_JAW_LANDMARKS.levels.flatMap((pair, k) =>
      pair.map((landmark, side): [number, FaceLikenessPoint] => [
        landmark,
        outline.levels[k]![side]!,
      ]),
    ),
  ];
}

/** Read the jaw's outline, or null when the mask shows no face to read. */
export function measureFaceLikenessJawOutline(
  mask: IFaceLikenessMask,
  points: readonly FaceLikenessPoint[],
): IFaceLikenessJawOutline | null {
  const at = (index: number): FaceLikenessPoint => {
    const value = points[index];
    if (value === undefined) throw new Error(`Landmark ${index} is missing.`);
    return value;
  };
  const iod = faceLikenessInterocular(points);
  if (!(iod > 0)) throw new Error("The eyes coincide; no face scale exists.");
  const middle = (a: FaceLikenessPoint, b: FaceLikenessPoint) =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const right = middle(at(33), at(133));
  const left = middle(at(362), at(263));
  const across = [(left[0] - right[0]) / iod, (left[1] - right[1]) / iod];
  const eyes = middle(right, left);
  const stomion = middle(at(13), at(14));
  const sign =
    -across[1]! * (stomion[0] - eyes[0]) +
      across[0]! * (stomion[1] - eyes[1]) >=
    0
      ? 1
      : -1;
  const down = [-sign * across[1]!, sign * across[0]!];
  const face = region(mask, at(4));
  if (face === null) return null;
  const inside = (p: FaceLikenessPoint): boolean => {
    const x = Math.round(p[0]);
    const y = Math.round(p[1]);
    return (
      x >= 0 &&
      y >= 0 &&
      x < mask.width &&
      y < mask.height &&
      face[y * mask.width + x] === 1
    );
  };
  const point = (t: number, s: number): FaceLikenessPoint => [
    stomion[0] + (t * down[0]! + s * across[0]!) * iod,
    stomion[1] + (t * down[1]! + s * across[1]!) * iod,
  ];
  let menton: number | null = null;
  for (let t = REACH; t > 0; t -= STEP)
    if (inside(point(t, 0))) {
      menton = t;
      break;
    }
  if (menton === null) return null;
  const corners = middle(at(61), at(291));
  const mouth =
    ((corners[0] - stomion[0]) * down[0]! +
      (corners[1] - stomion[1]) * down[1]!) /
    iod;
  const levels: [FaceLikenessPoint, FaceLikenessPoint][] = [];
  for (const fraction of FACE_LIKENESS_JAW_LEVELS) {
    const t = mouth + fraction * (menton - mouth);
    const side = (direction: 1 | -1): FaceLikenessPoint | null => {
      for (let s = REACH; s > 0; s -= STEP)
        if (inside(point(t, direction * s))) return point(t, direction * s);
      return null;
    };
    const [negative, positive] = [side(-1), side(1)];
    if (negative === null || positive === null) return null;
    levels.push([negative, positive]);
  }
  return { menton: point(menton, 0), levels };
}

/** The mask's 4-connected region holding `seed`, or null outside it. */
function region(
  mask: IFaceLikenessMask,
  seed: FaceLikenessPoint,
): Uint8Array | null {
  const x0 = Math.round(seed[0]);
  const y0 = Math.round(seed[1]);
  if (
    x0 < 0 ||
    y0 < 0 ||
    x0 >= mask.width ||
    y0 >= mask.height ||
    mask.data[y0 * mask.width + x0] !== 1
  )
    return null;
  const out = new Uint8Array(mask.data.length);
  const stack = [y0 * mask.width + x0];
  out[stack[0]!] = 1;
  while (stack.length > 0) {
    const index = stack.pop()!;
    const x = index % mask.width;
    const y = (index - x) / mask.width;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const) {
      if (nx < 0 || ny < 0 || nx >= mask.width || ny >= mask.height) continue;
      const next = ny * mask.width + nx;
      if (mask.data[next] !== 1 || out[next] === 1) continue;
      out[next] = 1;
      stack.push(next);
    }
  }
  return out;
}
