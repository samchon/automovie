import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
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
 * @evidence contracts/development/common.md#meaningful-documentation States the placement, the swing's geometry and who fits the press.
 * @evidence contracts/development/implementation.md#principled-implementation The chord of a swing about the digit's first joint: a straight digit of length r dropped by d reaches sqrt(r^2 - d^2) ahead.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The digit's length from the rest skeleton, the drawback, the hover point, the wrist.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No offset is chosen: the drawback is the swing's own, from the body's digit and the key's travel.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per press.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per press by the plan and the fingering.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function manipulateReach(
  body: IHumanBody,
  side: HumanHand.Side,
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
   * @evidence contracts/development/common.md#meaningful-documentation States the immutable inputs, per-contact inputs and returned wrist's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the original chord drawback r-sqrt(max(0,r*r-d*d)) and rigid fingertip offset; digit span, rotated unit direction and rotated tip are independent of the site's place and key depth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A lazy digit record owns fixed skeletal geometry; each contact computes only its depth-dependent drawback and world translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No authored site, travel, hover height, digit or hand rotation is approximated or clamped differently.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each of at most five supported digits reads its skeleton/hand offset once; N contact placements then perform constant translation/chord work without repeating those geometric queries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only an unchanged body, side and fixed sequence rotation share digit geometry; the plan and each fingering search create their own builders, while every changed site and depth is evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous preparation owns at most five digit records for its plan-construction or fingering call and is released before the resulting motion plan is returned; no global or time-result cache exists.
   */
  export function prepare(
    body: IHumanBody,
    side: HumanHand.Side,
    rotation: IAutoMovieQuaternion,
  ): (digit: string, site: IAutoMovieVector3, normal: IAutoMovieVector3, depth: number) => IAutoMovieVector3 {
    const digits: Map<string, IDigit> = new Map();
    return (digit: string, site: IAutoMovieVector3, normal: IAutoMovieVector3, depth: number): IAutoMovieVector3 => {
      let prepared: IDigit | undefined = digits.get(digit);
      if (prepared === undefined) {
        const surface: HumanHand.Surface = `${digit}Tip` as HumanHand.Surface;
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
