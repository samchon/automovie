import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Arm goals that put hand surfaces on their points, the contact first and
 * the hand's turn as close as the arm allows.
 *
 * A hand goal names a surface, a point and a hand rotation, and the arm
 * solver places the wrist. When the arm cannot turn the hand as asked (the
 * forearm does not pronate or supinate in the current solver, and wrist
 * flexion and deviation are clamped to their range), a wrist placed for the
 * asked rotation leaves the surface off its point by the turn it missed. So
 * each wrist is first placed for the asked rotation, the arms are solved, and
 * each wrist is re-placed from the rotation the hand actually reached,
 * keeping the asked rotation as the solver's aim, `PASSES` times. Every
 * placement is solved and each hand keeps the one whose surface lands
 * nearest its point, so a re-placement that moves the arm onto another
 * solution (across the forearm's twist limit) is never preferred. A
 * reachable rotation keeps its first placement.
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
 * @evidence contracts/development/implementation.md#efficient-algorithms `PASSES` + 1 posture solves for all hands together.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function handGoals(
  body: IHumanBody,
  posture: IHumanPosture,
  requests: readonly handGoals.IRequest[],
): IHumanPosture {
  if (requests.length === 0) return posture;
  const limb = (side: HumanHand.Side): "leftArm" | "rightArm" =>
    side === "left" ? "leftArm" : "rightArm";
  const first: IHumanPosture["limbs"] = { ...posture.limbs };
  for (const r of requests) {
    const wrist: HumanHand.IWrist = HumanHand.place(
      body,
      r.side,
      r.surface,
      r.point,
      r.rotation,
      r.shape,
    );
    first[limb(r.side)] = {
      point: wrist.point,
      rotation: wrist.rotation,
      bend: r.bend,
    };
  }
  // Each candidate is solved and each hand keeps the candidate whose surface
  // lands nearest its point: a re-placement that tips the forearm across its
  // twist limit onto another solution is never kept over a better one.
  const best: Map<HumanHand.Side, { miss: number; goal: IHumanPosture.IGoal }> =
    new Map();
  let limbs: IHumanPosture["limbs"] = first;
  for (let pass: number = 0; pass <= PASSES; pass++) {
    const bones = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs }),
    );
    const next: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const r of requests) {
      const miss: number = Vector3.length(
        Vector3.subtract(
          HumanHand.frame(body, bones, r.side, r.surface, r.shape).point,
          r.point,
        ),
      );
      const known = best.get(r.side);
      if (known === undefined || miss < known.miss)
        best.set(r.side, { miss, goal: limbs[limb(r.side)]! });
      const reached: IAutoMovieQuaternion = bones.get(
        `${r.side}Hand`,
      )!.worldRotation;
      const offset: IAutoMovieVector3 = HumanHand.offset(
        body,
        r.side,
        r.surface,
        r.shape,
      ).point;
      next[limb(r.side)] = {
        point: Vector3.subtract(
          r.point,
          Quaternion.rotateVector(reached, offset),
        ),
        rotation: r.rotation,
        bend: r.bend,
      };
    }
    limbs = next;
  }
  const chosen: IHumanPosture["limbs"] = { ...posture.limbs };
  for (const r of requests) chosen[limb(r.side)] = best.get(r.side)!.goal;
  return { ...posture, limbs: chosen };
}

/** Correction passes: two bring the contact within a few millimetres where one leaves up to two centimetres (measured on the rest places). */
const PASSES: number = 2;

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
