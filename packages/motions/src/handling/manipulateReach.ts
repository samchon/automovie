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
 * and drawn back toward the hand by as much as the digit's swing down to the
 * key's bottom shortens its reach.
 *
 * A straight digit of length r from its first joint, swung down by the hover
 * height and the key's travel d, reaches sqrt(r^2 - d^2) ahead of that joint,
 * not r: a tip placed straight over the key would stop short of it by the
 * difference. So the hover point moves back along the digit by
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the placement and swing geometry; prepare fixes an unchanged body/hand/rotation and takes each actual digit, world site/normal and metre key depth, returning the wrist's world-metre point.
 * @evidence contracts/development/implementation.md#principled-implementation The chord of a swing about the digit's first joint: a straight digit of length r dropped by d reaches sqrt(r^2 - d^2) ahead.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The cold facade invokes the same prepared owner used by manipulation/fingering; one lazy digit record precedes depth-dependent drawback and actual world translation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No offset is chosen: the drawback is the swing's own, from the body's digit and the key's travel.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each of at most five supported digits reads skeletal span and rotated tip/direction once per preparation; N subsequent placements perform constant chord/translation work without repeated hand geometry. The cold facade prepares for its one query; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only explicitly unchanged body, side and rotation share digit geometry through a sequence/fingering operation; actual site, normal and depth remain query inputs, with no computed wrist answer reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold placement retains nothing. The synchronous sequence/fingering owner retains at most five local digit records until its builder is released before the motion plan returns, without global, pose/time history or external handles.
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed body/hand/rotation scope and both current consumers.
 * @evidence contracts/development/design.md#principled-representation The closure preserves world-metre sites and normals, metre key travel and the original straight-digit chord geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One preparation function serves the existing cold reach facade, manipulation plan and fingering; no second hand geometry representation is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The body owns every digit length and tip offset, and the original supported digit names remain unchanged.
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
   * offset retain all sites, travels, hover height and rotations. Each of
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
      const back: number = radius - Math.sqrt(Math.max(0, radius * radius - drop * drop));
      return Vector3.subtract(Vector3.subtract(
        Vector3.add(site, Vector3.scale(normal, typeText.HOVER)),
        Vector3.scale(prepared.along, back),
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
