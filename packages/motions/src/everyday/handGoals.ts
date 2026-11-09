import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { poseBones } from "./poseBones";

/**
 * Arm goals that put hand surfaces on their points, the contact first and
 * the hand's turn as close as the arm allows.
 *
 * A hand goal names a surface, a point and a hand rotation, and the arm
 * solver places the wrist. When the arm cannot turn the hand as asked (the
 * forearm does not pronate or supinate in the current solver, and wrist
 * flexion and deviation are clamped to their range), a wrist placed for the
 * asked rotation leaves the surface off its point by the turn it missed. So
 * the goals are solved twice: the first pass places each wrist for the asked
 * rotation, the arms are solved, and the second pass re-places each wrist
 * from the rotation the hand actually reached, keeping the asked rotation as
 * the solver's aim. The contact point then holds to within the change the
 * re-placement itself causes, and a reachable rotation is unchanged, since
 * its second pass equals its first.
 *
 * @param body The body.
 * @param posture The posture the arms are added to; its legs and trunk are solved with them.
 * @param requests One request per moving hand.
 * @returns The posture with the arm goals set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why two passes are needed and what each keeps.
 * @evidence contracts/development/implementation.md#principled-implementation A fixed-point step on the rigid socket offset: the wrist is the point less the reached rotation applied to the socket offset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Place, solve, re-place; one shared helper for every everyday hand goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The asked rotation stays the solver's aim; the correction only moves the wrist.
 * @evidence contracts/development/implementation.md#efficient-algorithms One extra posture solve for all hands together.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function handGoals(body: IHumanBody, posture: IHumanPosture, requests: readonly handGoals.IRequest[]): IHumanPosture {
  if (requests.length === 0) return posture;
  const limb = (side: HumanHand.Side): "leftArm" | "rightArm" => (side === "left" ? "leftArm" : "rightArm");
  const first: IHumanPosture["limbs"] = { ...posture.limbs };
  for (const r of requests) {
    const wrist: HumanHand.IWrist = HumanHand.place(body, r.side, r.surface, r.point, r.rotation, r.shape);
    first[limb(r.side)] = { point: wrist.point, rotation: wrist.rotation, bend: r.bend };
  }
  const bones = poseBones(body, resolveHumanPosture(body, { ...posture, limbs: first }));
  const second: IHumanPosture["limbs"] = { ...posture.limbs };
  for (const r of requests) {
    const reached: IAutoMovieQuaternion = bones.get(`${r.side}Hand`)!.worldRotation;
    const offset: IAutoMovieVector3 = HumanHand.offset(body, r.side, r.surface, r.shape).point;
    second[limb(r.side)] = { point: Vector3.subtract(r.point, Quaternion.rotateVector(reached, offset)), rotation: r.rotation, bend: r.bend };
  }
  return { ...posture, limbs: second };
}

/**
 * Companion types of {@link handGoals}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame.
 * @evidence contracts/development/design.md#principled-representation A hand surface, its world point and rotation, the hand shape and the elbow hint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the everyday laws pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses HumanHand's surface and shape types.
 */
export namespace handGoals {
  /** One hand's goal. */
  export interface IRequest {
    /** The hand. */
    side: HumanHand.Side;

    /** The surface brought to the point. */
    surface: HumanHand.Surface;

    /** The hand shape the posture holds. */
    shape: HumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's asked world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres. */
    bend: IAutoMovieVector3;
  }
}
