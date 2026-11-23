import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { typeText } from "../everyday/typeText";
import { HumanHand } from "../posture/HumanHand";

/**
 * Where the wrist stands for one press of a keyed contact sequence
 * (`manipulate`): the hand turned as the act keeps it, the pressing digit
 * straight, its tip over the site at typing's hover height (`typeText.HOVER`)
 * and advanced along the digit by as much as its swing down to the
 * key's bottom shortens its reach.
 *
 * A straight digit of length r from its first joint, swung down by the hover
 * height and the key's travel d, reaches sqrt(r^2 - d^2) ahead of that joint,
 * not r: a tip placed straight over the key would stop short of it by the
 * difference. The knuckle advances along the digit by
 * r - sqrt(r^2 - d^2), and the press is a swing about the first joint that
 * ends on the key, which the digit's own inverse kinematics then fits.
 *
 * @param body The body.
 * @param side The hand.
 * @param digit The pressing digit, as `manipulate.Finger` names it.
 * @param site The site, world metres.
 * @param normal The site's outward unit normal, world.
 * @param depth The key's travel, metres.
 * @param rotation The hand's world rotation from its rest for the act.
 * @returns The wrist's world point.
 */
export function manipulateReach(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  digit: string,
  site: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  depth: number,
  rotation: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  return manipulateReach.prepare(body, side, rotation)(digit, site, normal, depth);
}

/**
 * Fixed-body preparation for the plan and fingering's repeated press placements.
 */
export namespace manipulateReach {
  /**
   * Prepare the hand's fixed rotation and lazily read each used digit once.
   *
   * @param body The unchanged canonical body and rest skeleton.
   * @param side The hand.
   * @param rotation The fixed hand rotation from its rest for this sequence.
   * @returns The wrist point for a digit, world site and normal, and key depth in metres.
   *
   * The original chord drawback r-sqrt(max(0,r*r-d*d)) and rigid fingertip
   * offset account for the actual inclination of the digit to the key plane. Each of
   * at most five digits reads fixed span/rotated direction/tip on first use;
   * every actual contact calculates its own drawback and translation. Only
   * unchanged body/side/rotation geometry is shared, and the synchronous
   * owner releases these records before returning its plan, without a
   * result, pose or time history.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion,
  ): (digit: string, site: IAutoMovieVector3, normal: IAutoMovieVector3, depth: number) => IAutoMovieVector3 {
    const digits: Map<string, IDigit> = new Map();
    return (digit: string, site: IAutoMovieVector3, normal: IAutoMovieVector3, depth: number): IAutoMovieVector3 => {
      let prepared: IDigit | undefined = digits.get(digit);
      if (prepared === undefined) {
        const surface: IAutoMovieMotionHumanHand.Surface = `${digit}Tip` as IAutoMovieMotionHumanHand.Surface;
        const name: string = `${digit[0]!.toUpperCase()}${digit.slice(1)}`;
        const first: AutoMovieHumanoidBone = `${side}${name}${digit === "thumb" ? "Metacarpal" : "Proximal"}` as AutoMovieHumanoidBone;
        const tip: IAutoMovieVector3 = HumanHand.offset(body, side, surface, "flat").point;
        const knuckle: IAutoMovieVector3 = Vector3.subtract(
          body.rest.get(first)!, body.rest.get(`${side}Hand`)!,
        );
        const span: IAutoMovieVector3 = Vector3.subtract(tip, knuckle);
        prepared = {
          radius: Vector3.length(span),
          along: Vector3.normalize(Quaternion.rotateVector(rotation, span)),
          tip: Quaternion.rotateVector(rotation, tip),
        };
        digits.set(digit, prepared);
      }
      const radius: number = prepared.radius;
      const drop: number = typeText.HOVER + depth;
      const slope: number = Vector3.dot(prepared.along, normal);
      const tangentSquared: number = drop * drop * Math.max(0, 1 - slope * slope);
      // Advance the knuckle by the chord's lost horizontal reach. An
      // oblique digit also drops along its own axis by drop * slope.
      const advance: number =
        radius - drop * slope - Math.sqrt(Math.max(0, radius * radius - tangentSquared));
      return Vector3.subtract(Vector3.addScaled(
        Vector3.addScaled(site, normal, typeText.HOVER), prepared.along, advance,
      ), prepared.tip);
    };
  }
}

/** The actual straight-digit geometry in one fixed hand rotation. */
interface IDigit {
  /** The straight digit's first-joint-to-tip length, metres. */
  radius: number;

  /** Its unit direction in the fixed world hand rotation. */
  along: IAutoMovieVector3;

  /** Wrist-to-tip offset turned into that same world rotation, metres. */
  tip: IAutoMovieVector3;
}
