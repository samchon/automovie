/**
 * The vermilion's borders read from a portrait's midline colour.
 *
 * The face mesh detector places the lower lip's lower border (17) where the
 * rest of the face predicts it: rendered with the lower lip's height at its
 * two ends, the detector's lower vermilion moved by a twentieth of the
 * change (README "Instrument"). The border is nonetheless in the image, as
 * the edge between the vermilion's colour and the skin's.
 *
 * The profile runs down the midline, perpendicular to the eye line, from
 * `REACH` above the outer upper lip (landmark 0) to `REACH` below the outer
 * lower lip (17), each sample the per-channel CIELAB median of columns
 * 0.01 to 0.03 inter-ocular to either side of it (clear of the dark line of
 * the philtrum's groove and of a tooth gap). The skin's colour is the
 * median of the profile 0.15 to 0.35 inter-ocular beyond each outer lip
 * landmark (the philtrum above, the chin below) and each lip's colour the
 * median of the middle half between its outer and inner landmarks (0 and
 * 13, 14 and 17). Colour here is chroma alone, a* and b*: the shadow below
 * the lower lip and the philtrum's shading change lightness, not
 * haemoglobin's redness. Each border is the first sample, from the skin
 * toward the lip within `WINDOW` of the detector's outer lip landmark (above
 * or below it) and the middle of the lip, whose chroma lies nearer the
 * lip's than the skin's and more than halfway from the skin's to the lip's.
 * A lip whose chroma differs from its skin's by less than `CONTRAST` (a
 * monochrome print; a lip no redder than its skin) is not read, nor a
 * border the window does not hold (its first sample already lip, or none
 * lip).
 *
 * Pure: the image and points are read, never mutated.
 */
import {
  type IFaceLikenessImage,
  faceLikenessSrgbToLab,
} from "./faceLikenessColour";
import {
  type FaceLikenessPoint,
  faceLikenessInterocular,
  faceLikenessMedian,
} from "./faceLikenessGeometry";

/** The vermilion's midline borders in image pixels, null where unread. */
export interface IFaceLikenessVermilion {
  /** Labrale superius, the upper lip's border with the philtrum. */
  superius: FaceLikenessPoint | null;
  /** Labrale inferius, the lower lip's border with the chin. */
  inferius: FaceLikenessPoint | null;
}

/** The landmark indices the borders are given past the jaw's outline. */
export const FACE_LIKENESS_VERMILION_LANDMARKS = {
  superius: 475,
  inferius: 476,
} as const;

const COLUMNS = [-0.03, -0.02, -0.01, 0.01, 0.02, 0.03];
const STEP = 0.002;
/** The skin's samples lie 0.15 to this far beyond the outer landmarks. */
const REACH = 0.35;
/** How far beyond the detector's outer landmark a border is sought. */
const WINDOW = 0.08;
/** The least chroma difference between lip and skin, CIELAB units. */
const CONTRAST = 4;

/** Read the vermilion's midline borders of a portrait. */
export function measureFaceLikenessVermilion(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
): IFaceLikenessVermilion {
  const at = (index: number): FaceLikenessPoint => {
    const value = points[index];
    if (value === undefined) throw new Error(`Landmark ${index} is missing.`);
    return value;
  };
  const iod = faceLikenessInterocular(points);
  if (!(iod > 0)) throw new Error("The eyes coincide; no mouth scale exists.");
  const middle = (a: FaceLikenessPoint, b: FaceLikenessPoint) =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const right = middle(at(33), at(133));
  const left = middle(at(362), at(263));
  const across = [(left[0] - right[0]) / iod, (left[1] - right[1]) / iod];
  const eyes = middle(right, left);
  const centre = middle(at(13), at(14));
  const sign =
    -across[1]! * (centre[0] - eyes[0]) + across[0]! * (centre[1] - eyes[1]) >=
    0
      ? 1
      : -1;
  const down = [-sign * across[1]!, sign * across[0]!];
  const along = (index: number) =>
    ((at(index)[0] - centre[0]) * down[0]! +
      (at(index)[1] - centre[1]) * down[1]!) /
    iod;
  const [outerTop, innerTop, innerBottom, outerBottom] = [0, 13, 14, 17].map(
    along,
  ) as [number, number, number, number];
  const samples: { t: number; chroma: [number, number] }[] = [];
  for (let t = outerTop - REACH; t <= outerBottom + REACH; t += STEP) {
    const labs = COLUMNS.flatMap((offset) => {
      const x = Math.round(
        centre[0] + (t * down[0]! + offset * across[0]!) * iod,
      );
      const y = Math.round(
        centre[1] + (t * down[1]! + offset * across[1]!) * iod,
      );
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) return [];
      const index = 3 * (y * image.width + x);
      return [
        faceLikenessSrgbToLab(
          image.rgb[index]!,
          image.rgb[index + 1]!,
          image.rgb[index + 2]!,
        ),
      ];
    });
    if (labs.length === 0) continue;
    samples.push({
      t,
      chroma: [
        faceLikenessMedian(labs.map((lab) => lab[1]))!,
        faceLikenessMedian(labs.map((lab) => lab[2]))!,
      ],
    });
  }
  const colour = (from: number, to: number): [number, number] | null => {
    const within = samples.filter(({ t }) => t >= from && t <= to);
    return within.length === 0
      ? null
      : [
          faceLikenessMedian(within.map(({ chroma }) => chroma[0]))!,
          faceLikenessMedian(within.map(({ chroma }) => chroma[1]))!,
        ];
  };
  const distance = (a: readonly [number, number], b: [number, number]) =>
    Math.hypot(a[0] - b[0], a[1] - b[1]);
  const point = (t: number): FaceLikenessPoint => [
    centre[0] + t * iod * down[0]!,
    centre[1] + t * iod * down[1]!,
  ];
  // One border: the first sample from the skin's side within the window
  // nearer the lip's chroma than the skin's and past halfway to it.
  const border = (
    skin: [number, number] | null,
    lip: [number, number] | null,
    from: number,
    to: number,
  ): FaceLikenessPoint | null => {
    if (skin === null || lip === null) return null;
    const contrast = distance(lip, skin);
    if (contrast < CONTRAST) return null;
    const order = samples.filter(
      ({ t }) => t >= Math.min(from, to) && t <= Math.max(from, to),
    );
    if (from > to) order.reverse();
    const lipLike = ({ chroma }: { chroma: [number, number] }) =>
      distance(chroma, skin) > contrast / 2 &&
      distance(chroma, lip) < distance(chroma, skin);
    // A window that starts on the lip does not hold its border.
    if (order.length === 0 || lipLike(order[0]!)) return null;
    const found = order.find(lipLike);
    return found === undefined ? null : point(found.t);
  };
  return {
    superius: border(
      colour(outerTop - REACH, outerTop - 0.15),
      colour(
        outerTop + 0.25 * (innerTop - outerTop),
        outerTop + 0.75 * (innerTop - outerTop),
      ),
      outerTop - WINDOW,
      (outerTop + innerTop) / 2,
    ),
    inferius: border(
      colour(outerBottom + 0.15, outerBottom + REACH),
      colour(
        innerBottom + 0.25 * (outerBottom - innerBottom),
        innerBottom + 0.75 * (outerBottom - innerBottom),
      ),
      outerBottom + WINDOW,
      (innerBottom + outerBottom) / 2,
    ),
  };
}
