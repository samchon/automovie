import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";

/**
 * Lumbar share of the column from the seventh cervical vertebra down to the sacrum, per lumbar segment: the lumbar part measures 18 cm and the thoracic 28 cm of a 71 cm male column (Gray 1918, "Anatomy of the Human Body", 20th ed., The Vertebral Column as a Whole), and the lumbar part has five vertebrae with their discs. Grade: conventional (an anatomical account), held at every age.
 */
const LUMBAR_SEGMENT: number = 18 / (28 + 18) / 5;

/**
 * Lumbar segments from the sacral plate up to the top of the iliac crests. The crests lie at the fourth lumbar spinous process in men and at the fourth-fifth interspace in women on imaging (Chakraverty et al. 2007, J Anat 210(2):232-236; Cooperstein and Truong 2017, PMC5596973), one to one and a half segments above the plate, so 1.25 pooled. Grade: derived.
 */
const CREST_ABOVE_SACRUM: number = 1.25;

/**
 * Vertebral levels of the curve's turning points, in segments. The lumbar curve begins at the middle of the last thoracic vertebra, the thoracic curve runs from there to the middle of the second thoracic vertebra with its most prominent point behind at the seventh (Gray 1918), four and a half lumbar segments above the plate, then five and ten thoracic segments up. The lordosis turns vertical at its apex, the third-fourth lumbar interspace two segments above the plate, because its lower arc from the plate to the apex equals the sacral slope and about two thirds of the lordosis lies from L4 to S1 (Roussouly and Pinheiro-Franco 2011, Eur Spine J 20(Suppl 5):578-585). The sacral plate is 1.2 lumbar segments deep, so its posterior superior corner lies 0.6 behind its midpoint. Grade: conventional.
 */
const LEVEL: Record<
  | "lumbarApex"
  | "inflection"
  | "thoracicApex"
  | "secondThoracic"
  | "thoracicSegments"
  | "plateHalfDepth",
  number
> = {
  lumbarApex: 2,
  inflection: 4.5,
  thoracicApex: 5,
  secondThoracic: 10,
  thoracicSegments: 11.5,
  plateHalfDepth: 0.6,
};

/** Samples along the column for integration and lookup. */
const SAMPLES: number = 400;

/**
 * Curve the vertebral column in the side view, from the sacral plate to the seventh cervical vertebra.
 *
 * The column is the line of vertebral body centres. Heights are the identity's: the sacral plate 1.25 lumbar segments below the iliac crest, the seventh cervical vertebra at cervicale height. The plate's midpoint stands behind the hip axis by the pelvic tilt, and the column leaves it perpendicular to the plate, leaning forward by the sacral slope. Its direction then turns through Roussouly's arcs (Roussouly and Pinheiro-Franco 2011): the lower lordotic arc, equal to the sacral slope, makes the column vertical at the lumbar apex; the upper lordotic arc leans it back until the inflection at the middle of T12; the lower kyphotic arc, equal to the upper lordotic one, brings it vertical again at T7, the thoracic apex; the upper kyphotic arc leans it forward to the second thoracic vertebra by the rest of the kyphosis, and that slope holds to C7. Within each arc the direction turns evenly with height, the arc-of-circle model of the radiographic studies.
 *
 * The upper lordotic arc, and with it the lumbar lordosis, is solved so the seventh cervical vertebra stands the identity's sagittal vertical axis in front of the plate's posterior superior corner: the survey balance holds and lordosis follows it, as the lordosis is the curve that balances the trunk over the pelvis. A balance no arc between -45 and 90 degrees reaches is taken at the nearer bound.
 *
 * @param body The body measurements
 * @param hip Height of the hip axis, the root, millimetres
 * @param crest Height of the iliac crests, millimetres
 * @returns The curve, read by height
 */
export function curveAutoMovieHumanSpine(
  body: IAutoMovieHumanIdentity.IBody,
  hip: number,
  crest: number,
): curveAutoMovieHumanSpine.IOutput {
  const posture: IAutoMovieHumanIdentity.IPosture = body.posture;
  const c7: number = body.cervicaleHeight;
  const sacrum: number =
    (crest - CREST_ABOVE_SACRUM * LUMBAR_SEGMENT * c7) /
    (1 - CREST_ABOVE_SACRUM * LUMBAR_SEGMENT);
  const segment: number = LUMBAR_SEGMENT * (c7 - sacrum);
  const inflection: number = sacrum + LEVEL.inflection * segment;
  const thoracic: number = (c7 - inflection) / LEVEL.thoracicSegments;
  const radians: (degrees: number) => number = (degrees: number): number =>
    (degrees * Math.PI) / 180;
  const plate: number = -(sacrum - hip) * Math.tan(radians(posture.pelvicTilt));
  const corner: number =
    plate -
    LEVEL.plateHalfDepth * segment * Math.cos(radians(posture.sacralSlope));

  // direction (degrees forward of vertical) at the turning points, for an upper lordotic arc
  const knots: (upper: number) => Array<[number, number]> = (
    upper: number,
  ): Array<[number, number]> => {
    const ss: number = posture.sacralSlope;
    const tk: number = posture.thoracicKyphosis;
    return [
      [sacrum, ss],
      [sacrum + LEVEL.lumbarApex * segment, Math.max(0, -upper)],
      [inflection, -upper],
      [
        inflection + LEVEL.thoracicApex * thoracic,
        -upper + Math.min(Math.max(upper, 0), tk),
      ],
      [inflection + LEVEL.secondThoracic * thoracic, -upper + tk],
      [c7, -upper + tk],
    ];
  };
  const integrate: (upper: number) => number[] = (upper: number): number[] => {
    const points: Array<[number, number]> = knots(upper);
    const direction: (y: number) => number = (y: number): number => {
      for (let i: number = 1; i < points.length; ++i) {
        const [y1, a1]: [number, number] = points[i]!;
        if (y <= y1 || i === points.length - 1) {
          const [y0, a0]: [number, number] = points[i - 1]!;
          return y1 === y0 ? a1 : a0 + ((y - y0) / (y1 - y0)) * (a1 - a0);
        }
      }
      return points[points.length - 1]![1];
    };
    const step: number = (c7 - sacrum) / SAMPLES;
    const z: number[] = [plate];
    for (let i: number = 0; i < SAMPLES; ++i)
      z.push(
        z[i]! + Math.tan(radians(direction(sacrum + (i + 0.5) * step))) * step,
      );
    return z;
  };
  const balance: (upper: number) => number = (upper: number): number =>
    integrate(upper)[SAMPLES]! - corner;

  // the neck moves back as the upper lordotic arc grows, so bisect it
  let low: number = -45;
  let high: number = 90;
  for (let i: number = 0; i < 60; ++i) {
    const middle: number = (low + high) / 2;
    if (balance(middle) > posture.sagittalVerticalAxis) low = middle;
    else high = middle;
  }
  const upper: number = (low + high) / 2;
  const z: number[] = integrate(upper);
  const top: number = posture.thoracicKyphosis - upper;
  const at: (y: number) => number = (y: number): number => {
    const t: number = ((y - sacrum) / (c7 - sacrum)) * SAMPLES;
    if (t <= 0)
      return z[0]! + (y - sacrum) * Math.tan(radians(posture.sacralSlope));
    if (t >= SAMPLES) return z[SAMPLES]! + (y - c7) * Math.tan(radians(top));
    const i: number = Math.floor(t);
    return z[i]! + (t - i) * (z[i + 1]! - z[i]!);
  };
  return {
    at,
    sacrum,
    plate,
    lumbarLordosis: posture.sacralSlope + upper,
    cervicalSlope: top,
  };
}
/** Output type of {@link curveAutoMovieHumanSpine}. */
export namespace curveAutoMovieHumanSpine {
  /**
   * The curved column.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Front-back position of the column at a height, millimetres, +Z forward of the hip axis; extended straight beyond the sacral plate and C7. */
    at: (y: number) => number;

    /** Height of the sacral plate's midpoint, millimetres. */
    sacrum: number;

    /** Front-back position of the sacral plate's midpoint, millimetres. */
    plate: number;

    /** The lumbar lordosis the balance solved, sacral plate to the inflection, degrees. */
    lumbarLordosis: number;

    /** Forward lean of the column at C7, degrees from the vertical. */
    cervicalSlope: number;
  }
}
