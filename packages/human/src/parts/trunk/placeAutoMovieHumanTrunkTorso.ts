import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";
import { reliefAutoMovieHumanTrunk } from "./reliefAutoMovieHumanTrunk";

/**
 * Share of the bust's added girth that becomes the projection of each breast, before the girth fit corrects it. Conventional.
 */
const BREAST_PROJECTION: number = 0.45;

/**
 * Breast mound weights across the torso columns from the sternum (0) to the posterior axillary line (7): the base spans from beside the sternum to the midaxillary line (Gray 1918, "The Mammae"), the apex near the third column, about 45 degrees from the front.
 */
const BREAST_ACROSS: number[] = [0, 0.22, 0.72, 1, 0.85, 0.4, 0.08, 0];

/**
 * Breast mound weights down the loops, with the lift of each loop per millimetre of projection: the inframammary fold (8) carries the lower pole and is drawn down by its weight, the chest point (9) the apex, the axilla level (10) the upper pole sloping to the chest wall (11). Conventional.
 */
const BREAST_DOWN: Array<[number, number, number]> = [
  [8, 0.42, -0.18],
  [9, 1.0, -0.1],
  [10, 0.5, 0],
  [11, 0.1, 0],
];

/** Share of each breast's projection turned outward, as breasts point slightly lateral. Conventional. */
const BREAST_LATERAL: number = 0.25;

/**
 * Place the torso loops of one side: thirteen loops sampled from the profile, with muscle relief and the breasts.
 *
 * Each loop runs at its own heights in front, at the side and behind, because the trunk's natural lines are not level: the thigh roots rise from the gluteal fold to the groin, the loops of the abdomen follow the rectus inscriptions while the side follows the iliac crest and the costal margin, and the upper back rises toward the seventh cervical vertebra. Loop 0 and the shoulder slots are placed again by the hip and shoulder placements.
 *
 * The breasts are two mounds on loops 8 to 11, their projection from the girth the bust adds over the underbust, lowered with their own weight and turned slightly outward.
 *
 * @param frame The side's trunk frame
 * @param profile The side's continuous body
 * @param tune Corrections from the girth fit
 * @returns `loops[i][j]` for the left half's columns 0 to 12, in the left frame
 */
export function placeAutoMovieHumanTrunkTorso(
  frame: IAutoMovieHumanTrunkFrame,
  profile: profileAutoMovieHumanTrunk.IProfile,
  tune: IAutoMovieHumanTrunkTune,
): IAutoMovieVector3[][] {
  const S: number = frame.stature;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const hip: number = frame.hip.y;
  const c7: number = frame.cervicale.y;
  const heights: Array<[number, number, number]> = [
    [lerp(L.crotch, hip, 0.45), lerp(L.crotch, hip, 0.15), L.gluteal],
    [lerp(hip, frame.iliospinale.y, 0.15), frame.trochanterion.y - 0.004 * S, lerp(L.gluteal, L.buttock, 0.5)],
    [lerp(hip, frame.iliospinale.y, 0.5), frame.trochanterion.y + 0.01 * S, L.buttock],
    [frame.iliospinale.y, lerp(frame.trochanterion.y, frame.iliocristale.y, 0.55), lerp(L.buttock, frame.iliocristale.y, 0.5)],
    [L.navel, frame.iliocristale.y + 0.006 * S, frame.iliocristale.y - 0.012 * S],
    [lerp(L.navel, L.costal, 0.33), L.waist, L.waist],
    [lerp(L.navel, L.costal, 0.66), lerp(L.waist, L.costal, 0.5), lerp(L.waist, L.costal, 0.5)],
    [L.costal, L.costal + 0.004 * S, L.costal + 0.008 * S],
    [L.fold, L.fold + 0.008 * S, L.fold + 0.014 * S],
    [L.chestPoint, L.chestPoint + 0.012 * S, L.chestPoint + 0.02 * S],
    [L.axilla + 0.012 * S, L.axilla, lerp(L.axilla, c7, 0.22)],
    [lerp(L.axilla, frame.suprasternale.y, 0.55), frame.shoulder.y, lerp(L.axilla, c7, 0.55)],
    [frame.suprasternale.y, frame.acromion.y, c7],
  ];
  const loops: IAutoMovieVector3[][] = heights.map(
    ([front, side, back]: [number, number, number]): IAutoMovieVector3[] =>
      Array.from({ length: 13 }, (_: unknown, j: number): IAutoMovieVector3 => {
        // front and back heights blend into the side's by the square cosine of the column's angle
        const c: number = Math.cos((j / 12) * Math.PI);
        return profile.section(
          j,
          c >= 0 ? lerp(side, front, c * c) : lerp(side, back, c * c),
        );
      }),
  );
  reliefAutoMovieHumanTrunk(loops, frame);

  const projection: number =
    Math.max(0, frame.chest.girth - frame.underbust) * BREAST_PROJECTION * tune.breast;
  if (projection > 0.5) {
    for (const [i, weight, drop] of BREAST_DOWN)
      BREAST_ACROSS.forEach((across: number, j: number): void => {
        if (j === 0 || across === 0) return;
        const w: number = across * weight * projection;
        const q: IAutoMovieVector3 = loops[i]![j]!;
        loops[i]![j] = AutoMovieHumanVector.of(
          q.x + BREAST_LATERAL * w,
          q.y + drop * w,
          q.z + w,
        );
      });
    // the sternum between the breasts rises a little with them
    const q: IAutoMovieVector3 = loops[9]![0]!;
    loops[9]![0] = AutoMovieHumanVector.of(0, q.y, q.z + 0.12 * projection);
  }
  return loops;
}
