import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { curveAutoMovieHumanTrunk } from "./curveAutoMovieHumanTrunk";

/**
 * Distance from the vertebral column back to the skin as a share of the local depth. Started from transverse sections in Gray (1918, "Anatomy of the Human Body"), about 0.37 of the abdominal depth over the lumbar spine and 0.3 of the chest depth over the thorax, then fitted by least squares to the section centres of twelve MakeHuman CC0 bodies (base mesh hm08 with its caucasian and universal macro targets: women and men young at average, minimum and maximum weight and maximum muscle, old, and child), sliced at ten stations between the crotch and the seventh cervical vertebra. Grade: fitted to a CC0 reference.
 */
const BEHIND_COLUMN: Record<"lumbar" | "waist" | "thorax" | "axilla", number> = {
  lumbar: 0.46,
  waist: 0.38,
  thorax: 0.31,
  axilla: 0.235,
};

/**
 * Squareness exponents of the half-sections, front and back, at the buttock, the waist, the costal arch and the chest point; 2 is an ellipse. Fitted by least squares to the breadth- and depth-normalized section outlines of the twelve MakeHuman CC0 bodies described at `BEHIND_COLUMN`, with the front of the buttock and waist at the fit's lower bound of 1.7: the reference's lower abdomen is rounder than a superellipse can follow. Grade: fitted to a CC0 reference.
 */
const SQUARENESS: Record<"front" | "back", Record<"buttock" | "waist" | "costal" | "chest", number>> = {
  front: { buttock: 1.7, waist: 1.7, costal: 2.45, chest: 2.29 },
  back: { buttock: 2.74, waist: 2.21, costal: 2.93, chest: 2.69 },
};

/**
 * Front-back position of the widest point of the section as a share of the way from the back to the front: below the iliac crest, at the waist and over the chest, fitted with `SQUARENESS` to the same references. Grade: fitted to a CC0 reference.
 */
const WIDEST: Record<"pelvis" | "waist" | "chest", number> = {
  pelvis: 0.65,
  waist: 0.48,
  chest: 0.44,
};

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
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const chestDepth: number = frame.chest.depth * tune.chest.depth;
  const waistDepth: number = frame.waist.depth * tune.waist.depth;
  const buttockDepth: number = frame.buttock.depth * tune.hip.depth;
  const behind: (y: number) => number = curveAutoMovieHumanTrunk([
    [frame.iliocristale.y, BEHIND_COLUMN.lumbar * waistDepth],
    [L.waist, BEHIND_COLUMN.waist * waistDepth],
    [L.chestPoint, BEHIND_COLUMN.thorax * chestDepth],
    [L.axilla, BEHIND_COLUMN.axilla * chestDepth],
  ]);
  const back = (y: number): number => frame.column(y) - behind(y);
  const chestBack: number = back(L.chestPoint);
  const chestFront: number = chestBack + chestDepth;
  const waistBack: number = back(L.waist);
  const waistFront: number = waistBack + waistDepth;
  const spineFront: number =
    frame.iliospinale.z + 0.012 * S + 0.3 * Math.max(0, frame.fat - 15);
  const buttockFront: number = Math.max(
    spineFront - 0.006 * S,
    lerp(spineFront, waistFront, 0.35),
  );
  const buttockBack: number = buttockFront - buttockDepth;
  const front: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.crotch, buttockFront - 0.016 * S],
    [L.buttock, buttockFront],
    [frame.iliospinale.y, Math.max(spineFront, lerp(buttockFront, waistFront, 0.55))],
    [L.navel, lerp(Math.max(spineFront, buttockFront), waistFront, 0.92)],
    [L.waist, waistFront],
    [L.costal, lerp(waistFront, chestFront, 0.75)],
    [L.fold, chestFront - 0.004 * S],
    [L.chestPoint, chestFront],
    [L.axilla, chestFront - 0.006 * S],
    [frame.suprasternale.y, frame.suprasternale.z],
  ]);
  const rear: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.gluteal, buttockBack + 0.02 * S],
    [L.buttock, buttockBack],
    [lerp(L.buttock, frame.iliocristale.y, 0.55), lerp(buttockBack, back(frame.iliocristale.y), 0.45)],
    [frame.iliocristale.y, back(frame.iliocristale.y)],
    [L.waist, waistBack],
    [L.tenthRib, back(L.tenthRib)],
    [L.chestPoint, chestBack],
    [L.axilla, back(L.axilla)],
    [lerp(L.axilla, frame.cervicale.y, 0.55), lerp(back(L.axilla), frame.cervicale.z, 0.4)],
    [frame.cervicale.y, frame.cervicale.z],
  ]);
  const hipHalf: number = (frame.buttock.breadth / 2) * tune.hip.breadth;
  const waistHalf: number = (frame.waist.breadth / 2) * tune.waist.breadth;
  const chestHalf: number = (frame.chest.breadth / 2) * tune.chest.breadth;
  const half: (y: number) => number = curveAutoMovieHumanTrunk([
    [L.gluteal, hipHalf * 0.97],
    [frame.trochanterion.y - 0.008 * S, hipHalf],
    [frame.iliocristale.y - 0.02 * S, lerp(hipHalf, waistHalf, 0.55)],
    [L.waist, waistHalf],
    [L.costal, lerp(waistHalf, chestHalf, 0.8) * tune.under.breadth],
    [L.chestPoint, chestHalf],
    [L.axilla, chestHalf * (1.04 + 0.05 * frame.muscle)],
  ]);
  const squareness = (side: "front" | "back"): ((y: number) => number) =>
    curveAutoMovieHumanTrunk([
      [L.buttock, SQUARENESS[side].buttock * tune.hip.squareness],
      [L.waist, SQUARENESS[side].waist * tune.waist.squareness],
      [L.costal, SQUARENESS[side].costal],
      [L.chestPoint, SQUARENESS[side].chest],
    ]);
  const frontSquareness: (y: number) => number = squareness("front");
  const backSquareness: (y: number) => number = squareness("back");
  const widest = (y: number): number => {
    const share: number =
      y < frame.iliocristale.y
        ? WIDEST.pelvis
        : y < L.waist
          ? lerp(WIDEST.pelvis, WIDEST.waist, (y - frame.iliocristale.y) / (L.waist - frame.iliocristale.y))
          : WIDEST.chest;
    return lerp(rear(y), front(y), share);
  };
  return {
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
export namespace profileAutoMovieHumanTrunk {
  /**
   * The trunk's body of one side, read by height.
   *
   * @author Samchon
   */
  export interface IProfile {
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
