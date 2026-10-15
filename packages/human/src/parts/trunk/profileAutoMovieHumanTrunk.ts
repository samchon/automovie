import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { curveAutoMovieHumanTrunk } from "./curveAutoMovieHumanTrunk";

/**
 * The trunk's continuous body of one side: at every height, the half breadth, the front and back of the midline, the depth of the widest point and the squareness of the front and back halves, through which the cage loops are sampled.
 *
 * The back follows the vertebral column at its depth fraction, so the lordosis and kyphosis of the skeleton show on the back, and the front lies the measured depth ahead of it; fat therefore deepens the front more than the back, as the ANSUR II depth regressions record. The pelvis takes the anterior superior iliac spines and the buttock depth instead, the upper chest the jugular notch and cervicale.
 *
 * @param frame The side's trunk frame
 * @param tune Corrections from the girth fit
 * @returns The profile
 */
export function profileAutoMovieHumanTrunk(
  frame: IAutoMovieHumanTrunkFrame,
  tune: IAutoMovieHumanTrunkTune,
): profileAutoMovieHumanTrunk.IProfile {
  const S: number = frame.stature;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const F: IAutoMovieHumanTrunkForm = AUTOMOVIE_HUMAN_TRUNK_FORM;
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const chestDepth: number = frame.chest.depth * tune.chest.depth;
  const waistDepth: number = frame.waist.depth * tune.waist.depth;
  const buttockDepth: number = frame.buttock.depth * tune.hip.depth;
  const behind: (y: number) => number = curveAutoMovieHumanTrunk([
    [frame.iliocristale.y, F.behind.lumbar * waistDepth],
    [L.waist, F.behind.waist * waistDepth],
    [L.chestPoint, F.behind.thorax * chestDepth],
    [L.axilla, F.behind.axilla * chestDepth],
  ]);
  const back = (y: number): number => frame.column(y) - behind(y);
  const chestBack: number = back(L.chestPoint);
  const chestFront: number = chestBack + chestDepth;
  const waistBack: number = back(L.waist);
  const waistFront: number = waistBack + waistDepth;
  const spineFront: number =
    frame.iliospinale.z +
    F.front.spine * S +
    F.front.spineFat * Math.max(0, frame.fat - 15);
  const buttockFront: number = Math.max(
    spineFront - F.front.buttock * S,
    lerp(spineFront, waistFront, F.front.buttockToWaist),
  );
  const buttockBack: number = buttockFront - buttockDepth;
  const gluteal: number = F.gluteal.projection * buttockDepth;
  const front: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.crotch, buttockFront - F.front.pubis * S],
    [L.buttock, buttockFront],
    [
      frame.iliospinale.y,
      Math.max(spineFront, lerp(buttockFront, waistFront, F.front.iliac)),
    ],
    [
      L.navel,
      lerp(Math.max(spineFront, buttockFront), waistFront, F.front.navel),
    ],
    [L.waist, waistFront],
    [L.costal, lerp(waistFront, chestFront, F.front.costal)],
    [L.fold, chestFront - F.front.fold * S],
    [L.chestPoint, chestFront],
    [L.axilla, chestFront - F.front.axilla * S],
    [frame.suprasternale.y, frame.suprasternale.z],
  ]);
  const rear: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.gluteal, buttockBack + F.back.fold * S],
    [L.buttock, buttockBack + gluteal],
    [
      lerp(L.buttock, frame.iliocristale.y, 0.5),
      lerp(
        buttockBack + gluteal,
        back(frame.iliocristale.y),
        F.back.upperButtock,
      ),
    ],
    [frame.iliocristale.y, back(frame.iliocristale.y)],
    [L.waist, waistBack],
    [L.tenthRib, back(L.tenthRib)],
    [L.chestPoint, chestBack],
    [L.axilla, back(L.axilla)],
    [
      lerp(L.axilla, frame.cervicale.y, 0.55),
      lerp(back(L.axilla), frame.cervicale.z, F.back.upperBack),
    ],
    [frame.cervicale.y, frame.cervicale.z],
  ]);
  const hipHalf: number = (frame.buttock.breadth / 2) * tune.hip.breadth;
  const waistHalf: number = (frame.waist.breadth / 2) * tune.waist.breadth;
  const chestHalf: number = (frame.chest.breadth / 2) * tune.chest.breadth;
  const half: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.gluteal, hipHalf * F.half.gluteal],
    [frame.trochanterion.y - F.half.trochanter * S, hipHalf],
    [
      frame.iliocristale.y - F.half.crestBelow * S,
      lerp(hipHalf, waistHalf, F.half.crest),
    ],
    [L.waist, waistHalf],
    [L.costal, lerp(waistHalf, chestHalf, F.half.costal) * tune.under.breadth],
    [L.chestPoint, chestHalf],
    [
      L.axilla,
      chestHalf * (F.half.axilla + F.half.axillaMuscle * frame.muscle),
    ],
  ]);
  const squareness = (side: "front" | "back"): ((y: number) => number) =>
    curveAutoMovieHumanTrunk([
      [L.buttock, F.squareness[side].buttock * tune.hip.squareness],
      [L.waist, F.squareness[side].waist * tune.waist.squareness],
      [L.costal, F.squareness[side].costal],
      [L.chestPoint, F.squareness[side].chest],
    ]);
  const frontSquareness: (y: number) => number = squareness("front");
  const backSquareness: (y: number) => number = squareness("back");
  const widest = (y: number): number => {
    const share: number =
      y < frame.iliocristale.y
        ? F.widest.pelvis
        : y < L.waist
          ? lerp(
              F.widest.pelvis,
              F.widest.waist,
              (y - frame.iliocristale.y) / (L.waist - frame.iliocristale.y),
            )
          : F.widest.chest;
    return lerp(rear(y), front(y), share);
  };
  return {
    gluteal,
    half,
    front,
    back: rear,
    widest,
    section: (column: number, y: number): IAutoMovieVector3 => {
      if (column <= 6) {
        const t: number = (column / 6) * (Math.PI / 2);
        const n: number = frontSquareness(y);
        return AutoMovieHumanVector.of(
          half(y) * Math.pow(Math.sin(t), 2 / n),
          y,
          widest(y) + (front(y) - widest(y)) * Math.pow(Math.cos(t), 2 / n),
        );
      }
      const t: number = ((column - 6) / 6) * (Math.PI / 2);
      const n: number = backSquareness(y);
      return AutoMovieHumanVector.of(
        half(y) * Math.pow(Math.cos(t), 2 / n),
        y,
        widest(y) - (widest(y) - rear(y)) * Math.pow(Math.sin(t), 2 / n),
      );
    },
  };
}
/** Profile type of {@link profileAutoMovieHumanTrunk}. */
export namespace profileAutoMovieHumanTrunk {
  /**
   * The trunk's body of one side, read by height.
   *
   * @author Samchon
   */
  export interface IProfile {
    /** Projection the gluteus maximus masses add behind the section the profile gives, millimetres. */
    gluteal: number;

    /** Half breadth at a height. */
    half: (y: number) => number;

    /** Front of the midline at a height. */
    front: (y: number) => number;

    /** Back of the midline at a height. */
    back: (y: number) => number;

    /** Front-back position of the widest point at a height. */
    widest: (y: number) => number;

    /**
     * Point of the left half-section at a height for a torso column from 0 (anterior midline) to 12 (posterior midline): a superellipse quadrant on each side of the widest point.
     */
    section: (column: number, y: number) => IAutoMovieVector3;
  }
}
