import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { AUTOMOVIE_HUMAN_TRUNK_LOOPS } from "./AUTOMOVIE_HUMAN_TRUNK_LOOPS";
import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * Place the torso loops of one side: one continuous family of loops sampled from the profile, with the breasts.
 *
 * The loops follow anchor lines, each a height in front, at the side and behind, because the trunk's natural lines are not level: the thigh root rises from the gluteal fold to the groin, the front follows the iliac spines, the navel and the costal arch while the side follows the trochanter and the iliac crest, and the upper back rises toward the seventh cervical vertebra. Anchors run from the pubis (1) through the buttock point, the iliac spines, the navel, two levels between the navel and the costal arch, the costal arch, the inframammary fold and the chest point to halfway to the axilla (10); the lower loops sample them evenly by anchor index, so a loop lies about every 2% of stature and every anchor line is reached smoothly. The last three loops are the axilla, the mid shoulder and the top edge, which bound the arm opening. Loop 0, the thigh root, and the shoulder slots are placed again by the hip and shoulder placements.
 *
 * The breasts are two mounds, a smooth field over the loops by angle from the front and height about the chest point (the form record's `breast`): their projection is a share of the girth the bust adds over the underbust, they drop with their own weight and point slightly outward, and between them the front keeps a share of their projection over the sternum, so a large bust or a fat chest reads as one full front rather than two separate mounds. Their base spans from beside the sternum to the midaxillary line and from the second to the sixth rib (Gray 1918, "The Mammae").
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
  const blend = (
    a: [number, number, number],
    b: [number, number, number],
    t: number,
  ): [number, number, number] => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
  const axilla: [number, number, number] = [
    L.axilla + 0.012 * S,
    L.axilla,
    lerp(L.axilla, c7, 0.22),
  ];
  const chest: [number, number, number] = [
    L.chestPoint,
    L.chestPoint + 0.012 * S,
    L.chestPoint + 0.02 * S,
  ];
  // anchor lines, front, side and back heights, from the thigh root upward
  const anchors: Array<[number, number, number]> = [
    [lerp(L.crotch, hip, 0.45), lerp(L.crotch, hip, 0.15), L.gluteal],
    [
      lerp(hip, frame.iliospinale.y, 0.15),
      frame.trochanterion.y - 0.004 * S,
      lerp(L.gluteal, L.buttock, 0.5),
    ],
    [
      lerp(hip, frame.iliospinale.y, 0.5),
      frame.trochanterion.y + 0.01 * S,
      L.buttock,
    ],
    [
      frame.iliospinale.y,
      lerp(frame.trochanterion.y, frame.iliocristale.y, 0.55),
      lerp(L.buttock, frame.iliocristale.y, 0.5),
    ],
    [
      L.navel,
      frame.iliocristale.y + 0.006 * S,
      frame.iliocristale.y - 0.012 * S,
    ],
    [lerp(L.navel, L.costal, 0.33), L.waist, L.waist],
    [
      lerp(L.navel, L.costal, 0.66),
      lerp(L.waist, L.costal, 0.5),
      lerp(L.waist, L.costal, 0.5),
    ],
    [L.costal, L.costal + 0.004 * S, L.costal + 0.008 * S],
    [L.fold, L.fold + 0.008 * S, L.fold + 0.014 * S],
    chest,
    blend(chest, axilla, 0.5),
  ];
  const lower: number = AUTOMOVIE_HUMAN_TRUNK_LOOPS - 4;
  const heights: Array<[number, number, number]> = [anchors[0]!];
  for (let i: number = 0; i < lower; ++i) {
    const p: number = 1 + (i * (anchors.length - 2)) / (lower - 1);
    const k: number = Math.min(Math.floor(p), anchors.length - 2);
    heights.push(blend(anchors[k]!, anchors[k + 1]!, p - k));
  }
  heights.push(
    axilla,
    [
      lerp(L.axilla, frame.suprasternale.y, 0.55),
      frame.shoulder.y,
      lerp(L.axilla, c7, 0.55),
    ],
    [frame.suprasternale.y, frame.acromion.y, c7],
  );
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

  const B: IAutoMovieHumanTrunkForm.IBreast = AUTOMOVIE_HUMAN_TRUNK_FORM.breast;
  const projection: number =
    Math.max(0, frame.chest.girth - frame.underbust) *
    B.projection *
    tune.breast;
  if (projection > 0.5)
    loops.forEach((row: IAutoMovieVector3[], i: number): void => {
      if (i === 0 || i >= AUTOMOVIE_HUMAN_TRUNK_LOOPS - 2) return;
      row.forEach((q: IAutoMovieVector3, j: number): void => {
        if (j > 7) return;
        const angle: number = (j / 12) * 180;
        const reach: number = (q.y > L.chestPoint ? B.above : B.below) * S;
        const mound: number = Math.exp(-(((angle - B.angle) / B.spread) ** 2));
        const across: number =
          angle < B.angle ? Math.max(mound, B.fill) : mound;
        const w: number =
          projection *
          across *
          Math.exp(-(((q.y - L.chestPoint) / reach) ** 2));
        row[j] = AutoMovieHumanVector.of(
          j === 0 ? 0 : q.x + B.lateral * w * mound,
          q.y - B.drop * w,
          q.z + w,
        );
      });
    });
  return loops;
}
