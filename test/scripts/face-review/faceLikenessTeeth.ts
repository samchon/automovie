/**
 * Incisal edges read from a portrait's mouth.
 *
 * `fit-face-landmarks.ts` adds these as observations beside the face-mesh
 * landmarks, and `measure-face-likeness.ts` compares a render's with its
 * photograph's. The mesh landmarks trace the lips but never the teeth, so a
 * smile's lower lip can be matched either by lowering the lip or by opening
 * the jaw, and only the teeth tell the two apart: the upper incisors ride
 * the skull and the lower ones the mandible.
 *
 * The profile runs down the mouth's midline, perpendicular to the eye line,
 * from the outer upper lip (landmark 0) to the outer lower lip (17), each
 * sample the per-channel CIELAB median of ten columns 0.02 to 0.06
 * inter-ocular to either side (the central incisors' crowns, clear of the
 * dark line between them). A sample is tooth when its redness is at most
 * half the vermilion's and it is at least as light: enamel carries no
 * haemoglobin (a* near 0, where these portraits' vermilion reads 15 to 55)
 * and is lighter than lip under the same light, which also excludes the
 * dark oral cavity. The vermilion is the profile between the outer and inner
 * lip landmarks. An image whose vermilion redness is below 10 (a monochrome
 * print) cannot separate the two and yields nothing, as do lips that touch
 * (inner-lip landmarks 13 and 14 closer than 0.03 inter-ocular) and an open
 * mouth whose teeth are all hidden, where each edge may lie behind either
 * lip, and a mouth outside the image.
 *
 * Tooth runs are searched within 0.03 inter-ocular of the inner-lip
 * landmarks and a run shorter than 0.01 (a wet lip's highlight) is dropped.
 * A run nearer the upper lip than the lower is the upper incisors, the next
 * run below it the lower ones; a lone run nearer the lower lip is the lower
 * incisors behind a hidden upper arch. From occlusion:
 *
 * - The upper edge is at its run's end when non-tooth follows before the
 *   lower lip; at or below the run's start when the run reaches the lower
 *   lip, where the arches may merge; at or above the upper lip when only the
 *   lower incisors show.
 * - The lower edge is at its run's start when a gap of at least 0.02
 *   inter-ocular separates it from the upper run, and at or above that start
 *   when the gap is narrower, the contact shadow of teeth in occlusion whose
 *   lower edge hides behind the upper crowns. Without a lower run but with
 *   non-tooth below the upper edge, the lower edge is at or below the lower
 *   lip.
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

/** One incisal edge relative to a midline point along the face's down axis. */
export interface IFaceLikenessIncisalEdge {
  /** Midline point in image pixels. */
  point: FaceLikenessPoint;
  /** The edge is at, at or below, or at or above the point along `down`. */
  relation: "at" | "atOrBelow" | "atOrAbove";
}

/** What a portrait's mouth shows of the incisors. */
export interface IFaceLikenessTeeth {
  /** Unit vector perpendicular to the eye line, toward the mouth. */
  down: FaceLikenessPoint;
  upper: IFaceLikenessIncisalEdge | null;
  lower: IFaceLikenessIncisalEdge | null;
  /**
   * Visible upper and lower incisor lengths and the gap between the arches,
   * in inter-ocular units; null where that tooth or gap does not show.
   */
  upperExposure: number | null;
  lowerExposure: number | null;
  gap: number | null;
}

const COLUMNS = [
  -0.06, -0.05, -0.04, -0.03, -0.02, 0.02, 0.03, 0.04, 0.05, 0.06,
];
const STEP = 0.002;
const MARGIN = 0.03;
const SHORTEST_RUN = 0.01;
const CONTACT = 0.02;
const CLOSED = 0.03;
const MONOCHROME = 10;

/**
 * Read the incisal edges of a portrait with its 478 detector landmarks, or
 * null when the mouth shows nothing measurable.
 */
export function measureFaceLikenessTeeth(
  image: IFaceLikenessImage,
  points: readonly FaceLikenessPoint[],
): IFaceLikenessTeeth | null {
  const at = (index: number): FaceLikenessPoint => {
    const value = points[index];
    if (value === undefined) throw new Error(`Landmark ${index} is missing.`);
    return value;
  };
  const iod = faceLikenessInterocular(points);
  if (!(iod > 0)) throw new Error("The eyes coincide; no mouth scale exists.");
  const right = middle(at(33), at(133));
  const left = middle(at(362), at(263));
  const across: FaceLikenessPoint = [
    (left[0] - right[0]) / iod,
    (left[1] - right[1]) / iod,
  ];
  const eyes = middle(right, left);
  const centre = middle(at(13), at(14));
  const sign =
    -across[1] * (centre[0] - eyes[0]) + across[0] * (centre[1] - eyes[1]) >= 0
      ? 1
      : -1;
  const down: FaceLikenessPoint = [-sign * across[1], sign * across[0]];
  const along = (index: number) =>
    ((at(index)[0] - centre[0]) * down[0] +
      (at(index)[1] - centre[1]) * down[1]) /
    iod;
  const [outerTop, innerTop, innerBottom, outerBottom] = [0, 13, 14, 17].map(
    along,
  ) as [number, number, number, number];
  if (innerBottom - innerTop < CLOSED) return null;

  const samples: { t: number; lab: [number, number, number] }[] = [];
  for (let t = outerTop; t <= outerBottom; t += STEP) {
    const labs = COLUMNS.flatMap((offset) => {
      const x = Math.round(
        centre[0] + (t * down[0] + offset * across[0]) * iod,
      );
      const y = Math.round(
        centre[1] + (t * down[1] + offset * across[1]) * iod,
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
      lab: [0, 1, 2].map(
        (channel) => faceLikenessMedian(labs.map((lab) => lab[channel]!))!,
      ) as [number, number, number],
    });
  }
  const lip = samples.filter(({ t }) => t <= innerTop || t >= innerBottom);
  if (lip.length === 0) return null;
  const lipRedness = faceLikenessMedian(lip.map(({ lab }) => lab[1]))!;
  const lipLightness = faceLikenessMedian(lip.map(({ lab }) => lab[0]))!;
  if (lipRedness < MONOCHROME) return null;

  const runs: [number, number][] = [];
  let start: number | null = null;
  let last = 0;
  const close = () => {
    if (start !== null && last - start >= SHORTEST_RUN)
      runs.push([start, last]);
    start = null;
  };
  for (const { t, lab } of samples) {
    const tooth =
      t >= innerTop - MARGIN &&
      t <= innerBottom + MARGIN &&
      lab[1] <= lipRedness / 2 &&
      lab[0] >= lipLightness;
    if (tooth) {
      start ??= t;
      last = t;
    } else close();
  }
  close();
  if (runs.length === 0) return null;

  const point = (t: number): FaceLikenessPoint => [
    centre[0] + t * iod * down[0],
    centre[1] + t * iod * down[1],
  ];
  const first = runs[0]!;
  const upperRun = first[0] - innerTop <= innerBottom - first[1] ? first : null;
  const lowerRun = upperRun === null ? first : (runs[1] ?? null);
  const gap =
    upperRun !== null && lowerRun !== null ? lowerRun[0] - upperRun[1] : null;
  let upper: IFaceLikenessIncisalEdge;
  if (upperRun === null)
    upper = { point: point(innerTop), relation: "atOrAbove" };
  else if (lowerRun === null && upperRun[1] >= innerBottom - SHORTEST_RUN)
    upper = { point: point(upperRun[0]), relation: "atOrBelow" };
  else upper = { point: point(upperRun[1]), relation: "at" };
  let lower: IFaceLikenessIncisalEdge | null;
  if (lowerRun !== null)
    lower = {
      point: point(lowerRun[0]),
      relation: gap !== null && gap < CONTACT ? "atOrAbove" : "at",
    };
  else if (upper.relation === "at")
    lower = { point: point(innerBottom), relation: "atOrBelow" };
  else lower = null;
  return {
    down,
    upper,
    lower,
    upperExposure: upperRun === null ? null : upperRun[1] - upperRun[0],
    lowerExposure: lowerRun === null ? null : lowerRun[1] - lowerRun[0],
    gap,
  };
}

function middle(a: FaceLikenessPoint, b: FaceLikenessPoint): FaceLikenessPoint {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * Visible incisor lengths and gap of a measured mouth for comparison, in
 * inter-ocular units: an arch hidden in a mouth that shows teeth reads 0; a
 * gap that does not show and a mouth with nothing measurable read null.
 */
export function faceLikenessTeethLengths(teeth: IFaceLikenessTeeth | null): {
  upperExposure: number | null;
  lowerExposure: number | null;
  gap: number | null;
} {
  return teeth === null
    ? { upperExposure: null, lowerExposure: null, gap: null }
    : {
        upperExposure: teeth.upperExposure ?? 0,
        lowerExposure: teeth.lowerExposure ?? 0,
        gap: teeth.gap,
      };
}
