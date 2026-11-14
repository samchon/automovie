import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The other arm brought up so a hand can touch a region on it: the touch
 * law's presentation of a forearm, a wrist or a hand to be scratched, patted
 * or looked at.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is presented and who reads it.
 * @evidence contracts/development/design.md#principled-representation One arm goal on the entry posture and the bones it gives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and its solver; split from the touch law so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the effector's goal and the posture resolver; no region is named.
 */
export namespace touchPresented {
  /**
   * An arm brought up to be touched.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and its frame.
   * @evidence contracts/development/design.md#principled-representation The arm, the goal that holds it up and the body's bones with it there, which a region on that arm is read on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by the touch law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bones are resolved from the goal, never a second pose.
   */
  export interface IPresented {
    /** The arm. */
    side: HumanHand.Side;

    /** Its goal, world, on the entry posture. */
    goal: IHumanPosture.IGoal;

    /** The body's bones with that arm at its goal. */
    bones: ReturnType<typeof poseBones>;
  }

  /**
   * The other arm brought up for a hand to touch a region on it: its forearm
   * held across the front of the waist, the wrist on the body's midline half
   * way from the hips to the shoulders and a forearm's length ahead of the
   * hips, the palm down and the fingers toward the touching hand, the elbow on
   * the hanging arm's side. Null when the region does not ride the other arm.
   *
   * @param context The action's context.
   * @param side The touching hand.
   * @param target The touch's target.
   * @returns The presented arm, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the arm is held, on what it is read and when the result is null.
   * @evidence contracts/development/implementation.md#principled-implementation A person scratching or patting their own forearm brings it up first; the place is the body's own midline, half way from the hips to the shoulders and a forearm ahead, so it scales with the body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The region's bone, the place, the goal, the bones with the arm there.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a region on the other arm presents it; every length is the body's measure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector's goal, the bend preset and the posture resolver.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One posture solve per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "body" | "entry">,
    side: HumanHand.Side,
    target: AutoMovieMotionTarget,
  ): IPresented | null {
    if (target.kind !== "self") return null;
    const body = context.body;
    const other: HumanHand.Side = side === "right" ? "left" : "right";
    const bone = body.surfaces.regions[target.region].bone;
    if (
      bone !== `${other}UpperArm` &&
      bone !== `${other}LowerArm` &&
      bone !== `${other}Hand`
    )
      return null;
    const entry: IHumanPosture = context.entry.posture;
    const frame: HumanFrame.IFrame = { origin: entry.root, yaw: entry.yaw };
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const shoulder: IAutoMovieVector3 = body.rest.get(`${other}UpperArm`)!;
    const at: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: (hips.y + shoulder.y) / 2,
      z: hips.z + body.measure.forearm,
    });
    // The fingers point toward the touching hand's side: world +X is the
    // body's left at yaw 0.
    const across: IAutoMovieVector3 = Quaternion.rotateVector(
      HumanFrame.turn(entry.yaw),
      { x: side === "left" ? 1 : -1, y: 0, z: 0 },
    );
    const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchEffector.goal(
      body,
      other,
      { surface: "palm", shape: "flat" },
      at,
      { x: 0, y: 1, z: 0 },
      across,
      AutoMovieMotionHumanBend.arm(body, entry, other, "hang"),
    );
    return {
      side: other,
      goal,
      bones: poseBones(
        body,
        resolveHumanPosture(body, {
          ...entry,
          limbs: { ...entry.limbs, [`${other}Arm`]: goal },
        }),
      ),
    };
  }
}
