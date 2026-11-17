import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";
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
  body: IAutoMovieMotionHumanBody,
  side: IAutoMovieMotionHumanHand.Side,
  digit: string,
  site: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  depth: number,
  rotation: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  const surface: IAutoMovieMotionHumanHand.Surface = `${digit}Tip` as IAutoMovieMotionHumanHand.Surface;
  const name: string = `${digit[0]!.toUpperCase()}${digit.slice(1)}`;
  const first: AutoMovieHumanoidBone = `${side}${name}${
    digit === "thumb" ? "Metacarpal" : "Proximal"
  }` as AutoMovieHumanoidBone;

  // The digit from its first joint to its tip, in the hand's rest axes.
  const tip: IAutoMovieVector3 = HumanHand.offset(
    body,
    side,
    surface,
    "flat",
  ).point;
  const knuckle: IAutoMovieVector3 = Vector3.subtract(
    body.rest.get(first)!,
    body.rest.get(`${side}Hand`)!,
  );
  const span: IAutoMovieVector3 = Vector3.subtract(tip, knuckle);
  const r: number = Vector3.length(span);
  const d: number = typeText.HOVER + depth;
  const back: number = r - Math.sqrt(Math.max(0, r * r - d * d));
  const along: IAutoMovieVector3 = Vector3.normalize(
    Quaternion.rotateVector(rotation, span),
  );
  return HumanHand.place(
    body,
    side,
    surface,
    Vector3.subtract(
      Vector3.add(site, Vector3.scale(normal, typeText.HOVER)),
      Vector3.scale(along, back),
    ),
    rotation,
    "flat",
  ).point;
}
