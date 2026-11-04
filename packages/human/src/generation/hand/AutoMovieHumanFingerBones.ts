import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandDigitBones } from "./AutoMovieHumanHandDigitBones";
import { AutoMovieHumanHandJoints } from "./AutoMovieHumanHandJoints";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanHandFingerPosture } from "./IAutoMovieHumanHandFingerPosture";
import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus, scale, dot, unit }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { proximal }: typeof AutoMovieHumanHandJoints = AutoMovieHumanHandJoints;
const { onBones }: typeof AutoMovieHumanHandDigitBones = AutoMovieHumanHandDigitBones;

/**
 * A finger on its bones, from its knuckle to its tip.
 *
 * Its proximal phalanx leaves the knuckle toward the finger's root at the web,
 * flexed from the hand's axis by the bind's posture
 * (`AutoMovieHumanHandPosture.FINGERS`); the middle and distal phalanges turn
 * toward the palm by the posture's PIP and DIP angles. The finger runs its
 * web-to-tip length past its web (the more distal of its webs' crests along
 * the proximal phalanx), and its PIP and DIP stand at their measured shares of
 * that length from the web (Buryanov and Kotiuk 2010 Table III), where the
 * posture was read. The line turns at each joint over the elbow's rule, so the
 * bones keep their lengths and the straightened finger reaches its full
 * length.
 */
export namespace AutoMovieHumanFingerBones {
  /**
   * Build a finger's bones and skin law.
   *
   * @param d The finger's law in the hand form's axes.
   * @param index Finger, 1 for the index to 4 for the little finger.
   * @param mcp Its knuckle, left frame, mm.
   * @param frame The hand's frame on its knuckles.
   * @param webs Its webs' crests, left frame, mm.
   * @param external Its web-to-tip length, given its web's distance from its knuckle, mm.
   * @param map The hand's map from the form's axes to the left frame.
   * @param hand The hand's solved scales.
   */
  export function of(
    d: IAutoMovieHumanHandDigit,
    index: number,
    mcp: Vec3,
    frame: IAutoMovieHumanHandFrame,
    webs: readonly Vec3[],
    external: (web: number) => number,
    map: (q: readonly [number, number, number]) => Vec3,
    hand: IAutoMovieHumanHandScales,
  ): IAutoMovieHumanHandFinger {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const posture: IAutoMovieHumanHandFingerPosture = prior.posture;
    const shares: readonly number[] = prior.joints[index - 1]!;

    // The three legs: each phalanx's direction follows the one before it by
    // the posture's joint angle, toward the palm.
    const d1: Vec3 = proximal(index, frame);
    const d2: Vec3 = bend(d1, frame.palmar, posture.pip[index - 1]!);
    const d3: Vec3 = bend(d2, frame.palmar, posture.dip[index - 1]!);

    // The web is the datum of the finger's length and of its joints' shares,
    // the more distal of its webs along the proximal phalanx.
    const web: number = Math.max(...webs.map((w: Vec3): number => dot(sub(w, mcp), d1)));
    const beyond: number = external(web);
    const length: number = web + beyond;
    const s1: number = web + shares[0]! * beyond;
    const s2: number = web + shares[1]! * beyond;
    const rootAt: number = Math.max(0, dot(sub(map(d.centre), mcp), d1));

    const out: IAutoMovieHumanHandFinger = onBones(d, mcp, [
      { direction: d1, length: s1 },
      { direction: d2, length: s2 - s1 },
      { direction: d3, length: length - s2 },
    ], rootAt, [s1, s2], hand);
    return { ...out, joints: [mcp, ...out.joints.slice(0, 2)], external: beyond };
  }

  /** A direction turned toward the palm, square to itself, by degrees. */
  function bend(dir: Vec3, palmar: Vec3, degrees: number): Vec3 {
    const n: Vec3 = unit(sub(palmar, scale(dir, dot(palmar, dir))));
    const r: number = (degrees * Math.PI) / 180;
    return unit(plus(scale(dir, Math.cos(r)), scale(n, Math.sin(r))));
  }
}
