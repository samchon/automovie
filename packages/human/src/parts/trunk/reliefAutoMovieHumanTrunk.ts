import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/**
 * One relief term: loops and torso columns it lifts (positive) or sinks (negative), and its depth in millimetres for a 1750 mm adult as a constant plus terms per unit of muscularity, of muscularity shown through the fat (muscularity times definition), and per point of body fat above 18%.
 */
interface ITerm {
  loops: number[];
  columns: number[];
  base: number;
  muscle?: number;
  shown?: number;
  fat?: number;
}

/**
 * Superficial muscle and fat relief of the torso, one term per form in overlap order from Gray (1918, "Anatomy of the Human Body", the muscles of the trunk) and Bridgman (1920, "Constructive Anatomy"), with Richer's plates of the trunk's exterior forms (1890, "Anatomie artistique") as the visual check.
 *
 * The depths are fitted, not set by eye: Levenberg-Marquardt least squares of the breadth- and depth-normalized outlines of the subdivided trunk against twelve MakeHuman CC0 bodies (base mesh hm08 with its caucasian and universal macro targets: women and men young at average, minimum and maximum weight and maximum muscle, old, and child), sliced at nine stations between the crotch and the seventh cervical vertebra and four below the crotch around the thigh, with a prior that keeps each depth near its anatomical starting value. Because the references span weight and muscle, the constant, muscle, shown-muscle and fat parts of each term are separated by the fit. Where the fit turned a named furrow into a fill for the average build (the sternum between the pectorals, the pectoral's lower border, the linea alba), the furrow appears only through its muscle-shown part, as in a lean, muscular body. The gluteus maximus is not a term here: its mass is placed whole by `placeAutoMovieHumanTrunkGluteal`. Grade: fitted to a CC0 reference.
 *
 * Loops: 1 low buttock, 2 buttock point, 3 iliac spines, 4 navel and iliac crest, 5 to 7 the recti and the flank, 8 the pectoral border and inframammary fold, 9 the chest point, 10 the axilla, 11 the upper chest and mid scapula. Columns: 0 anterior midline, 3 linea semilunaris, 5 anterior axillary line, 6 midaxillary, 7 posterior axillary, 9 and 10 over the scapula, 12 posterior midline.
 */
const TERMS: ITerm[] = [
  // linea alba, the rectus bellies between its inscriptions, the inscriptions, the linea semilunaris, the navel
  { loops: [4, 5, 6, 7, 8], columns: [0], base: 0.7, shown: -0.3 },
  { loops: [5, 7], columns: [1, 2], base: 0.8, shown: 4.1 },
  { loops: [6, 8], columns: [1, 2], base: -3.9, shown: -3.8 },
  { loops: [4, 5, 6, 7], columns: [3], base: 0.5, shown: -4 },
  { loops: [4], columns: [0], base: -6.4 },
  // external oblique over the flank, its thick roll over the iliac crest, the furrow below it
  { loops: [5, 6, 7], columns: [4, 5], base: 1.3, muscle: -1.7 },
  { loops: [4], columns: [4, 5, 6], base: 2.6, muscle: 2.6, fat: 0.52 },
  { loops: [3], columns: [4, 5], base: 1.2, shown: -1.7 },
  // serratus anterior digitations, interlocking with the oblique
  { loops: [8], columns: [5], base: 0, shown: 1.7 },
  { loops: [9], columns: [6], base: -3, shown: 1.7 },
  // pectoralis major over the ribs, its free lower border, the sternal furrow between the two
  { loops: [9, 10], columns: [1, 2, 3, 4], base: 0.4, muscle: 4.8 },
  { loops: [11], columns: [2, 3, 4], base: 2, muscle: 5 },
  { loops: [8], columns: [2, 3, 4], base: 4, shown: -4.5 },
  { loops: [9, 10, 11], columns: [0], base: 4.4, muscle: 0.4 },
  // latissimus dorsi wings, the scapulae under the trapezius, the groove along their medial borders
  { loops: [7, 8, 9, 10], columns: [7, 8], base: 1.8, muscle: 7.2 },
  { loops: [9, 10, 11], columns: [9, 10], base: 0.4, muscle: 1.8 },
  { loops: [9, 10, 11], columns: [11], base: -0.8, muscle: -1.9 },
  // spinal furrow between the erector spinae columns, and the upper trapezius
  { loops: [4, 5, 6, 7, 8, 9, 10, 11], columns: [12], base: 1.4, muscle: -3.4 },
  { loops: [3, 4, 5, 6], columns: [11], base: -2.6, muscle: 2.1 },
  { loops: [11], columns: [10, 11], base: 2, muscle: 5 },
  // the natal cleft between the gluteal masses, gluteus medius above, the hollow behind the trochanter, the sacral dimples, tensor fasciae latae
  { loops: [1], columns: [12], base: -20.2, fat: -0.34 },
  { loops: [2], columns: [12], base: -11.6, fat: -0.04 },
  { loops: [3], columns: [12], base: -4.2 },
  { loops: [3], columns: [6, 7], base: -4.5, muscle: 2 },
  { loops: [2], columns: [6], base: -6, shown: -3.4 },
  { loops: [4], columns: [11], base: -1, shown: -1.7 },
  { loops: [1, 2], columns: [5], base: 2.6, muscle: 3 },
];

/**
 * Lift or sink each torso slot of one side along the loop's horizontal outward normal by the relief its muscles and fat give.
 *
 * Every term scales with stature, so a child's relief keeps its proportion; muscularity enlarges the bellies, definition lets the furrows and inscriptions show, and fat fills the iliac roll and the buttocks. Midline slots move only front to back.
 *
 * @param loops Left half loops, `loops[i][j]` for columns 0 to 12, modified in place; undefined slots are skipped
 * @param frame The side's trunk frame
 */
export function reliefAutoMovieHumanTrunk(
  loops: Array<Array<IAutoMovieVector3 | undefined>>,
  frame: IAutoMovieHumanTrunkFrame,
): void {
  const scale: number = frame.stature / 1750;
  const fat: number = Math.max(0, frame.fat - 18);
  const lift: number[][] = loops.map((): number[] => new Array<number>(13).fill(0));
  for (const term of TERMS) {
    const mm: number =
      (term.base +
        (term.muscle ?? 0) * frame.muscle +
        (term.shown ?? 0) * frame.muscle * frame.definition +
        (term.fat ?? 0) * fat) *
      scale;
    for (const i of term.loops) for (const j of term.columns) lift[i]![j]! += mm;
  }
  loops.forEach((row: Array<IAutoMovieVector3 | undefined>, i: number): void => {
    const moved: Array<IAutoMovieVector3 | undefined> = row.map(
      (q: IAutoMovieVector3 | undefined, j: number): IAutoMovieVector3 | undefined => {
        const mm: number = lift[i]![j]!;
        if (q === undefined || mm === 0) return q;
        const mirror = (p: IAutoMovieVector3): IAutoMovieVector3 =>
          AutoMovieHumanVector.of(-p.x, p.y, p.z);
        const previous: IAutoMovieVector3 | undefined =
          j === 0 ? mirror(row[1]!) : row[j - 1];
        const next: IAutoMovieVector3 | undefined =
          j === 12 ? mirror(row[11]!) : row[j + 1];
        if (previous === undefined || next === undefined) return q;
        // the loop runs counterclockwise about +Y seen from above, so its tangent (tx, tz) turns outward as (-tz, tx): +x at the front points to +z
        const tx: number = next.x - previous.x;
        const tz: number = next.z - previous.z;
        const length: number = Math.hypot(tx, tz) || 1;
        return AutoMovieHumanVector.of(
          j === 0 || j === 12 ? 0 : q.x - (tz / length) * mm,
          q.y,
          q.z + (tx / length) * mm,
        );
      },
    );
    moved.forEach((q: IAutoMovieVector3 | undefined, j: number): void => {
      row[j] = q;
    });
  });
}
