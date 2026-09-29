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
 * haemoglobin's redness. Each border is the first sample from skin toward
 * the inner lip whose chroma lies nearer the lip's than the skin's and more
 * than halfway from skin to lip. For the lower border, the search reaches
 * beyond the detector's outer point by that lip's own detector height;
 * a distant red chin cannot stand in for the border. The upper search keeps
 * its narrower detector window because the philtrum and nasal shadow can
 * resemble lip chroma outside it. The class medians must separate by more
 * than their combined within-region chroma deviations. A monochrome image
 * or a search that starts on lip remains unread.
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
/** Retained upper-lip search and chroma floor; its wider search sees philtrum. */
const UPPER_WINDOW = 0.08;
const UPPER_CONTRAST = 4;

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
  const samples: {
    t: number;
    chroma: [number, number];
    chromatic: boolean;
  }[] = [];
  for (let t = outerTop - REACH; t <= outerBottom + REACH; t += STEP) {
    let chromatic = false;
    const labs = COLUMNS.flatMap((offset) => {
      const x = Math.round(
        centre[0] + (t * down[0]! + offset * across[0]!) * iod,
      );
      const y = Math.round(
        centre[1] + (t * down[1]! + offset * across[1]!) * iod,
      );
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) return [];
      const index = 3 * (y * image.width + x);
      chromatic ||=
        image.rgb[index] !== image.rgb[index + 1] ||
        image.rgb[index + 1] !== image.rgb[index + 2];
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
      chromatic,
      chroma: [
        faceLikenessMedian(labs.map((lab) => lab[1]))!,
        faceLikenessMedian(labs.map((lab) => lab[2]))!,
      ],
    });
  }
  const distance = (
    a: readonly [number, number],
    b: readonly [number, number],
  ) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const colour = (
    from: number,
    to: number,
  ): { chroma: [number, number]; deviation: number; chromatic: boolean } | null => {
    const within = samples.filter(({ t }) => t >= from && t <= to);
    if (within.length === 0) return null;
    const chroma: [number, number] = [
      faceLikenessMedian(within.map((sample) => sample.chroma[0]))!,
      faceLikenessMedian(within.map((sample) => sample.chroma[1]))!,
    ];
    return {
      chroma,
      chromatic: within.some((sample) => sample.chromatic),
      deviation: faceLikenessMedian(
        within.map((sample) => distance(sample.chroma, chroma)),
      )!,
    };
  };
  const point = (t: number): FaceLikenessPoint => [
    centre[0] + t * iod * down[0]!,
    centre[1] + t * iod * down[1]!,
  ];
  // An observation needs separated colour populations and a skin-side
  // transition within one detector-estimated lip height of its outer point.
  const border = (
    skin: ReturnType<typeof colour>,
    lip: ReturnType<typeof colour>,
    from: number,
    to: number,
    minimumContrast: number,
  ): FaceLikenessPoint | null => {
    if (
      skin === null ||
      lip === null ||
      (!skin.chromatic && !lip.chromatic)
    )
      return null;
    const contrast = distance(lip.chroma, skin.chroma);
    if (
      contrast < minimumContrast ||
      contrast <= skin.deviation + lip.deviation
    )
      return null;
    const order = samples.filter(
      ({ t }) => t >= Math.min(from, to) && t <= Math.max(from, to),
    );
    if (from > to) order.reverse();
    const lipLike = ({ chroma }: { chroma: [number, number] }) =>
      distance(chroma, skin.chroma) > contrast / 2 &&
      distance(chroma, lip.chroma) < distance(chroma, skin.chroma);
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
      outerTop - UPPER_WINDOW,
      (outerTop + innerTop) / 2,
      UPPER_CONTRAST,
    ),
    inferius: border(
      colour(outerBottom + 0.15, outerBottom + REACH),
      colour(
        innerBottom + 0.25 * (outerBottom - innerBottom),
        innerBottom + 0.75 * (outerBottom - innerBottom),
      ),
      outerBottom + (outerBottom - innerBottom),
      innerBottom,
      0,
    ),
  };
}
