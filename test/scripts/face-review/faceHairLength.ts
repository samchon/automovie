/**
 * How far a head's hair falls and how much of the forehead it covers, read
 * the same way on a photograph and on a model under that photograph's
 * camera.
 *
 * The index is the image-space drop from the chin (menton, landmark 152) to
 * the lowest hair, in inter-ocular units (exocanthion to exocanthion, 33 and
 * 263), so camera distance and image scale cancel; negative means the hair
 * ends above the chin. On a photograph the hair is the segmenter's mask
 * restricted to its components that reach above the brows
 * (`faceHairHeadMask`): a collar, a beard or a background the segmenter
 * also marks does not grow from the scalp. A photograph whose head hair
 * reaches the image's last row is cut by the frame and has no index.
 *
 * Pure: reads caller-owned values and returns new ones.
 */

/** A binary mask, row-major. */
export interface IFaceHairMask {
  width: number;
  height: number;
  data: Uint8Array;
}

/** The mask's 4-connected components that have a pixel above `aboveY`. */
export function faceHairHeadMask(
  mask: IFaceHairMask,
  aboveY: number,
): IFaceHairMask {
  const { width, height, data } = mask;
  const label = new Int32Array(width * height).fill(-1);
  const keep: boolean[] = [];
  for (let start = 0; start < width * height; ++start) {
    if (data[start] === 0 || label[start]! >= 0) continue;
    const id = keep.length;
    let reaches = false;
    const stack = [start];
    label[start] = id;
    while (stack.length !== 0) {
      const at = stack.pop()!;
      const x = at % width;
      const y = (at - x) / width;
      if (y < aboveY) reaches = true;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (data[next] === 0 || label[next]! >= 0) continue;
        label[next] = id;
        stack.push(next);
      }
    }
    keep.push(reaches);
  }
  return {
    width,
    height,
    data: Uint8Array.from(label, (id) => (id >= 0 && keep[id] ? 1 : 0)),
  };
}

/**
 * The hair drop index from the chin and eye corners and the lowest hair
 * row, or null when the hair reaches the frame's edge (`clipped`).
 */
export function faceHairDropIndex(props: {
  chin: readonly [number, number];
  eyes: readonly [readonly [number, number], readonly [number, number]];
  lowest: number | null;
  clipped: boolean;
}): number | null {
  if (props.lowest === null || props.clipped) return null;
  const [a, b] = props.eyes;
  const interocular = Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (!(interocular > 0))
    throw new Error("The hair drop needs two distinct eye corners.");
  return (props.lowest - props.chin[1]) / interocular;
}

/** The lowest set row of a mask, or null when it is empty. */
export function faceHairLowestRow(mask: IFaceHairMask): number | null {
  for (let y = mask.height - 1; y >= 0; --y)
    for (let x = 0; x < mask.width; ++x)
      if (mask.data[y * mask.width + x] !== 0) return y;
  return null;
}

/**
 * The share of the forehead the hair covers: the rectangle from the top of
 * the forehead (landmark 10) down to the higher upper lid (159, 386) and
 * between the lateral eye corners (33, 263), the region a fringe falls
 * over, or null when it has no pixel.
 */
export function faceHairFringeCoverage(props: {
  mask: IFaceHairMask;
  top: readonly [number, number];
  eyes: readonly [readonly [number, number], readonly [number, number]];
  lids: readonly [readonly [number, number], readonly [number, number]];
}): number | null {
  const x0 = Math.max(
    0,
    Math.ceil(Math.min(props.eyes[0][0], props.eyes[1][0])),
  );
  const x1 = Math.min(
    props.mask.width,
    Math.floor(Math.max(props.eyes[0][0], props.eyes[1][0])),
  );
  const y0 = Math.max(0, Math.ceil(props.top[1]));
  const y1 = Math.min(
    props.mask.height,
    Math.floor(Math.min(props.lids[0][1], props.lids[1][1])),
  );
  let covered = 0;
  let total = 0;
  for (let y = y0; y < y1; ++y)
    for (let x = x0; x < x1; ++x) {
      ++total;
      if (props.mask.data[y * props.mask.width + x] !== 0) ++covered;
    }
  return total === 0 ? null : covered / total;
}

/** Chin-to-shoulder norms by sex (`population/shoulder-drop-norms.json`). */
export interface IFaceHairShoulderNorms {
  male: { acromion: { subjects: number; mean: number } };
  female: { acromion: { subjects: number; mean: number } };
}

/**
 * How far below menton the shoulder (acromion) sits for a recorded sex, in
 * metres: the survey's mean for that sex, or for an unrecorded sex the mean
 * over both samples weighted by their subjects. Hair a photograph shows
 * falling further than this lies on the shoulders.
 */
export function faceHairShoulderDrop(
  norms: IFaceHairShoulderNorms,
  sex: "female" | "male" | null,
): number {
  const groups = sex === null ? [norms.male, norms.female] : [norms[sex]];
  const subjects = groups.reduce((sum, one) => sum + one.acromion.subjects, 0);
  if (!(subjects > 0))
    throw new Error("The shoulder norms need a sample with subjects.");
  return (
    groups.reduce(
      (sum, one) => sum + one.acromion.subjects * one.acromion.mean,
      0,
    ) /
    subjects /
    1000
  );
}
