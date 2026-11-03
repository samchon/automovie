import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandFingerPosture } from "./IAutoMovieHumanHandFingerPosture";
import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";
import type { IAutoMovieHumanHandJoints } from "./IAutoMovieHumanHandJoints";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandMap } from "./AutoMovieHumanHandMap";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus, scale, dot, unit, across, cross }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;

/**
 * The hand's joints by its anatomy (`docs/anatomy/hand.md`): the knuckles and
 * the thumb's base from the scales and the form's roots, the hand's frame on
 * those knuckles, and each finger's proximal phalanx in the bind's posture.
 */
export namespace AutoMovieHumanHandJoints {
  /** Turns in which the knuckles and the frame standing on them settle: each moves the frame a tenth as much. */
  const FRAME_PASSES: number = 3;

  /**
   * The middle finger's web above its MCP joint as a share of its web-to-tip
   * length (Buryanov and Kotiuk 2010 Table III): the knuckle stands that far
   * below the webs the palm length reaches, so it never passes them.
   */
  const WEB_HEIGHT: number = 0.1533;

  /** Third metacarpal over the wrist centre to its head (de Leva's MET3 and Reddy's CT, `docs/anatomy/hand.md`). */
  const THIRD_METACARPAL: number = 0.774;

  /**
   * The wrist centre distal of stylion, mm: de Leva's radiale-stylion
   * offset, the one the forearm shares with the hand at the wrist joint.
   */
  export const STYLION: number = 1.5;

  /**
   * Metacarpal lengths over the third, thumb to little (Reddy 2024, sexes
   * pooled; `docs/anatomy/hand.md`).
   */
  const METACARPALS: readonly number[] = [0.711, 1.039, 1, 0.883, 0.797];

  /**
   * The knuckles and the thumb's base for a hand's scales. Each finger's
   * knuckle then moves onto the line of its proximal phalanx, which passes
   * through the finger's root at its web in the posture's direction, keeping
   * its station along the hand: the web, the root and the bone are one line,
   * as the posture was read.
   */
  export function jointsOf(hand: IAutoMovieHumanHandForm, measures: IAutoMovieHumanHandScales, law: IAutoMovieHumanHandWrist): IAutoMovieHumanHandJoints {
    const roots: Vec3[] = hand.digits.map((d: IAutoMovieHumanHandDigit): Vec3 => handPoint(d.centre, measures, law.wrist));
    const joints: IAutoMovieHumanHandJoints = knuckles(law.crease, measures, roots);
    const stations: Vec3[] = [...joints.mcps];
    // The frame stands on the knuckles the lines move, so the two settle in
    // turns.
    for (let pass: number = 0; pass < FRAME_PASSES; pass++) {
      joints.frame = frameOf(law.crease, joints.mcps);
      for (let i: number = 1; i < joints.mcps.length; i++) {
        const d1: Vec3 = proximal(i, joints.frame);
        const back: number = dot(sub(roots[i]!, stations[i]!), joints.frame.along) / dot(d1, joints.frame.along);
        joints.mcps[i] = sub(roots[i]!, scale(d1, back));
      }
    }
    joints.frame = frameOf(law.crease, joints.mcps);
    return joints;
  }

  /**
   * The hand's frame on its knuckles, the frame the posture was read in:
   * along from the wrist centre to knuckle III, across from knuckle V toward
   * II square to it, and palmar square to both.
   */
  export function frameOf(crease: Vec3, mcps: readonly Vec3[]): IAutoMovieHumanHandFrame {
    const along: Vec3 = unit(sub(mcps[2]!, crease));
    const across_: Vec3 = across(sub(mcps[1]!, mcps[4]!), along);
    const palmar: Vec3 = cross(across_, along);
    return {
      along,
      across: across_,
      palmar: dot(palmar, [...AutoMovieHumanArmPrior.PRIOR.hand.through]) >= 0 ? palmar : scale(palmar, -1),
    };
  }

  /**
   * A finger's proximal phalanx: turned from the hand's axis across the hand
   * by the posture's spread, then toward the palm by its flexion.
   */
  export function proximal(index: number, frame: IAutoMovieHumanHandFrame): Vec3 {
    const posture: IAutoMovieHumanHandFingerPosture = AutoMovieHumanArmPrior.PRIOR.hand.posture;
    const spread: number = (posture.spread[index - 1]! * Math.PI) / 180;
    const flexion: number = (posture.proximal[index - 1]! * Math.PI) / 180;
    const level: Vec3 = plus(scale(frame.along, Math.cos(spread)), scale(frame.across, Math.sin(spread)));
    return unit(plus(scale(level, Math.cos(flexion)), scale(frame.palmar, Math.sin(flexion))));
  }

  /**
   * The knuckles and the thumb's base by the hand's anatomy
   * (`docs/anatomy/hand.md`): the third metacarpal's head stands
   * {@link WEB_HEIGHT} of the middle finger's web-to-tip length below the
   * webs the palm length reaches from stylion, which lies {@link STYLION}
   * behind the wrist centre, the centre of the section at the crease; the third
   * metacarpal is {@link THIRD_METACARPAL} of that reach; the bases stand level
   * across the hand, and each metacarpal reaches its measured share of the
   * third toward its finger's root. The thumb's carpometacarpal joint stands
   * halfway from the crease to the thumb's branch, at the trapezium
   * (convention), its metacarpal {@link METACARPALS}[0] of the third.
   *
   * @param crease Centre of the hand's section at the wrist crease.
   * @param hand Hand and palm lengths from stylion.
   * @param roots Each digit's root at its web, thumb first.
   */
  export function knuckles(crease: Vec3, hand: IAutoMovieHumanHandMeasures, roots: Vec3[]): IAutoMovieHumanHandJoints {
    const along: Vec3 = [...AutoMovieHumanArmPrior.PRIOR.hand.along];
    const centre: Vec3 = crease;
    const reach: number = hand.palm - STYLION - WEB_HEIGHT * (hand.length - hand.palm);
    const third: number = THIRD_METACARPAL * reach;
    const middle: Vec3 = roots[2]!;
    const toward: Vec3 = unit(sub(middle, centre));
    const head: Vec3 = plus(centre, scale(toward, reach));
    const base: Vec3 = sub(head, scale(toward, third));
    const mcps: Vec3[] = roots.map((root: Vec3, i: number): Vec3 => {
      if (i === 0) return [0, 0, 0];
      const offset: Vec3 = sub(root, middle);
      const level: Vec3 = sub(offset, scale(along, dot(offset, along)));
      const own: Vec3 = plus(base, level);
      return plus(own, scale(unit(sub(root, own)), METACARPALS[i]! * third));
    });
    const cmc: Vec3 = scale(plus(crease, roots[0]!), 0.5);
    mcps[0] = plus(cmc, scale(unit(sub(roots[0]!, cmc)), METACARPALS[0]! * third));
    return { cmc, mcps };
  }
}
