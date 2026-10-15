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
 * Superficial muscle and fat relief of the torso, in overlap order from Gray (1918, "Anatomy of the Human Body", the muscles of the trunk) and Bridgman (1920, "Constructive Anatomy"), with Richer's plates of the trunk's exterior forms (1890, "Anatomie artistique") as the visual check. Depths are conventional, judged on renders; no source measures how far each belly stands above the fat.
 *
 * Loops: 1 low buttock, 2 buttock point, 3 iliac spines, 4 navel and iliac crest, 5 to 7 the recti and the flank, 8 the pectoral border and inframammary fold, 9 the chest point, 10 the axilla, 11 the upper chest and mid scapula. Columns: 0 anterior midline, 3 linea semilunaris, 5 anterior axillary line, 6 midaxillary, 7 posterior axillary, 9 and 10 over the scapula, 12 posterior midline.
 */
const TERMS: ITerm[] = [
  // linea alba, the rectus bellies between its inscriptions, the inscriptions, the linea semilunaris, the navel
  { loops: [4, 5, 6, 7, 8], columns: [0], base: -1.5, shown: -5 },
  { loops: [5, 7], columns: [1, 2], base: 2, shown: 5 },
  { loops: [6, 8], columns: [1, 2], base: -1, shown: -3 },
  { loops: [4, 5, 6, 7], columns: [3], base: -0.5, shown: -2.5 },
  { loops: [4], columns: [0], base: -6 },
  // external oblique over the flank, its thick roll over the iliac crest, the furrow below it
  { loops: [5, 6, 7], columns: [4, 5], base: 1, muscle: 2 },
  { loops: [4], columns: [4, 5, 6], base: 2, muscle: 3, fat: 0.25 },
  { loops: [3], columns: [4, 5], base: -1, shown: -2 },
  // serratus anterior digitations, interlocking with the oblique
  { loops: [8], columns: [5], base: 0, shown: 1.5 },
  { loops: [9], columns: [6], base: 0, shown: 1.5 },
  // pectoralis major over the ribs, its free lower border, the sternal furrow between the two
  { loops: [9, 10], columns: [1, 2, 3, 4], base: 3, muscle: 8 },
  { loops: [11], columns: [2, 3, 4], base: 2, muscle: 5 },
  { loops: [8], columns: [2, 3, 4], base: -1, shown: -3 },
  { loops: [9, 10, 11], columns: [0], base: -1, muscle: -3 },
  // latissimus dorsi wings, the scapulae under the trapezius, the groove along their medial borders
  { loops: [7, 8, 9, 10], columns: [7, 8], base: 2, muscle: 7 },
  { loops: [9, 10, 11], columns: [9, 10], base: 3, muscle: 3 },
  { loops: [9, 10, 11], columns: [11], base: -1, muscle: -2 },
  // spinal furrow between the erector spinae columns, and the upper trapezius
  { loops: [4, 5, 6, 7, 8, 9, 10, 11], columns: [12], base: -3, muscle: -5 },
  { loops: [3, 4, 5, 6], columns: [11], base: 3, muscle: 6 },
  { loops: [11], columns: [10, 11], base: 2, muscle: 5 },
  // gluteus maximus masses, the natal cleft between them, gluteus medius above, the hollow behind the trochanter, the sacral dimples, tensor fasciae latae
  { loops: [1, 2], columns: [9, 10], base: 13, muscle: 10, fat: 0.5 },
  { loops: [1, 2], columns: [8, 11], base: 7, muscle: 6, fat: 0.3 },
  { loops: [3], columns: [9, 10, 11], base: 4, muscle: 5 },
  { loops: [0], columns: [12], base: -12 },
  { loops: [1], columns: [12], base: -22, fat: -0.5 },
  { loops: [2], columns: [12], base: -16, fat: -0.4 },
  { loops: [3], columns: [12], base: -6 },
  { loops: [3], columns: [6, 7], base: 3, muscle: 5 },
  { loops: [2], columns: [6], base: -1, shown: -3 },
  { loops: [4], columns: [11], base: 0, shown: -1.5 },
  { loops: [1, 2], columns: [5], base: 2, muscle: 3 },
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
        // the loop runs counterclockwise about +Y, so the outward normal is its tangent turned clockwise
        const tx: number = next.x - previous.x;
        const tz: number = next.z - previous.z;
        const length: number = Math.hypot(tx, tz) || 1;
        return AutoMovieHumanVector.of(
          j === 0 || j === 12 ? 0 : q.x + (tz / length) * mm,
          q.y,
          q.z - (tx / length) * mm,
        );
      },
    );
    moved.forEach((q: IAutoMovieVector3 | undefined, j: number): void => {
      row[j] = q;
    });
  });
}
