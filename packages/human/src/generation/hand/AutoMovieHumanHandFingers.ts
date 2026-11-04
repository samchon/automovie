import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanFingerBones } from "./AutoMovieHumanFingerBones";
import { AutoMovieHumanHandJoints } from "./AutoMovieHumanHandJoints";
import { AutoMovieHumanHandMap } from "./AutoMovieHumanHandMap";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanThumbBones } from "./AutoMovieHumanThumbBones";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandJoints } from "./IAutoMovieHumanHandJoints";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, norm }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;
const { STYLION }: typeof AutoMovieHumanHandJoints = AutoMovieHumanHandJoints;

/**
 * Every digit of a hand on its bones, thumb first, composed from the finger's
 * and the thumb's own pieces: which web each finger parts at and how long it
 * runs past it.
 */
export namespace AutoMovieHumanHandFingers {
  /** Each finger's webs, as indices of the form's crests from the index side, index to little. */
  const WEBS: readonly (readonly number[])[] = [[0], [0, 1], [1, 2], [2]];

  /**
   * Every digit on its bones for a hand's scales and joints, thumb first.
   *
   * The middle finger's tip stands the hand length from stylion once the hand
   * is straight, so its web-to-tip length is what the hand length leaves past
   * its web; the other fingers run their measured share of that length
   * (`AutoMovieHumanArmPrior.PRIOR.hand.external`, Buryanov and Kotiuk 2010)
   * past their own webs; the thumb runs the thumb length from its MCP.
   */
  export function digitsOf(
    hand: IAutoMovieHumanHandForm,
    measures: IAutoMovieHumanHandScales,
    law: IAutoMovieHumanHandWrist,
    joints: IAutoMovieHumanHandJoints,
  ): IAutoMovieHumanHandFinger[] {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const map = (q: readonly [number, number, number]): Vec3 => handPoint(q, measures, law.wrist);
    const reach3: number = measures.length - STYLION - norm(sub(joints.mcps[2]!, law.crease));
    const crests: Vec3[] = hand.crests.map((c: Vec3): Vec3 => map(c));
    const own = (i: number, external: (web: number) => number): IAutoMovieHumanHandFinger =>
      AutoMovieHumanFingerBones.of(
        hand.digits[i]!,
        i,
        joints.mcps[i]!,
        joints.frame!,
        WEBS[i - 1]!.map((k: number): Vec3 => crests[k]!),
        external,
        map,
        measures,
      );

    // The middle finger first: the others are measured against its length.
    const middle: IAutoMovieHumanHandFinger = own(2, (web: number): number => reach3 - web);
    return hand.digits.map((d: IAutoMovieHumanHandDigit, i: number): IAutoMovieHumanHandFinger =>
      i === 0
        ? AutoMovieHumanThumbBones.of(d, joints, measures, map)
        : i === 2
          ? middle
          : own(i, (): number => middle.external * prior.external[i - 1]!),
    );
  }
}
