import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The pieces the crawls on the hands share: where a wrist stands over its
 * flat palm, the palms laid on their floor points, a body tilted forward by
 * a pitch with its pelvis turned about the spine's axis, and the root that
 * puts the hip joints' middle at a place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four pieces and what each gives.
 * @evidence contracts/development/design.md#principled-representation Pure functions of the body and a posture, shared by the crawl's kinds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four functions and the one share they use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is solved on the body; nothing is a length typed in metres.
 */
export namespace crawlFrame {
  /** The chest's share of the turn that levels the shoulders over a hiked pelvis; the lumbar spine takes the rest (as `AutoMovieMotionHumanTrunk.CHEST`). */
  export const CHEST: number = 0.6;

  /**
   * Each wrist over its flat palm on the floor, in the floor frame of the
   * heading from the palm.
   *
   * @param body The body.
   * @param standing The standing posture the crawl starts from.
   * @param forward The heading's unit vector.
   * @returns Each wrist from its palm, metres in the heading's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's own palm target and goal place the wrist, so the hand's thickness and the palm's offset are the body's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target and one goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The palm is laid at the origin facing up, so the offset is the hand's alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two goals, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Callers keep the result for the plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function wrists(
    body: IHumanBody,
    standing: IHumanPosture,
    forward: IAutoMovieVector3,
  ): Record<"left" | "right", IAutoMovieVector3> {
    const wrist = (side: "left" | "right"): IAutoMovieVector3 =>
      HumanFrame.local(
        { origin: { x: 0, y: 0, z: 0 }, yaw: standing.yaw },
        AutoMovieMotionHumanArm.goal(
          body,
          side,
          AutoMovieMotionHumanTarget.hand(
            body,
            standing,
            side,
            { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
            { surface: "palm", shape: "flat", forward },
          ),
        ).point,
      );
    return { left: wrist("left"), right: wrist("right") };
  }

  /**
   * A posture with both palms laid flat on floor points: each hand shaped
   * flat and its arm's goal the one that puts the palm on its point facing
   * up, the fingers along the heading.
   *
   * @param body The body.
   * @param posture The posture whose trunk the arms hang from.
   * @param palm Each palm's floor point, world metres.
   * @param forward The heading's unit vector.
   * @returns The posture with the two arm goals and the flat hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's own palm target and goal place each wrist, as `wrists` does at the origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target and one goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two goals per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function laid(
    body: IHumanBody,
    posture: IHumanPosture,
    palm: (side: "left" | "right") => IAutoMovieVector3,
    forward: IAutoMovieVector3,
  ): IHumanPosture {
    let out: IHumanPosture = posture;
    for (const side of ["left", "right"] as const)
      out = {
        ...out,
        joints: { ...out.joints, ...HumanHand.shape(side, "flat") },
        limbs: {
          ...out.limbs,
          [`${side}Arm`]: AutoMovieMotionHumanArm.goal(
            body,
            side,
            AutoMovieMotionHumanTarget.hand(
              body,
              out,
              side,
              { point: palm(side), normal: { x: 0, y: 1, z: 0 } },
              { surface: "palm", shape: "flat", forward },
            ),
          ),
        },
      };
    return out;
  }

  /**
   * The body tilted forward by a pitch at a share of the way down, its
   * pelvis turned about the spine's axis and the spine and the chest
   * turning it back.
   *
   * @param yaw The heading, degrees about +Y.
   * @param share The share of the way down, 0 standing and 1 on the hands.
   * @param degrees The whole body's forward pitch on the hands, degrees.
   * @param hike The pelvis's turn about the spine's axis, degrees; positive lifts the left hip.
   * @param neck The neck's flexion on the hands, degrees; negative lifts the gaze.
   * @returns The posture at the origin, with no limb goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and sign.
   * @evidence contracts/development/implementation.md#principled-implementation The spine and the chest share the hike's return by `CHEST`, so the shoulders stay level over the hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root is the caller's, from `rootFor`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function posed(
    yaw: number,
    share: number,
    degrees: number,
    hike: number,
    neck: number,
  ): IHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw,
      pitch: degrees * share,
      roll: 0,
      joints: {
        ...stand.RELAXED,
        neck: [neck * share, 0, 0],
        hips: [0, 0, hike],
        spine: [0, 0, -(1 - CHEST) * hike],
        chest: [0, 0, -CHEST * hike],
      },
      limbs: {},
    };
  }

  /**
   * The root that puts a tilted posture's hip joints' middle at a place.
   *
   * @param body The body.
   * @param tilted The posture whose heading and pelvis count.
   * @param hips The hip joints' middle, world metres.
   * @returns The root, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the frame.
   * @evidence contracts/development/implementation.md#principled-implementation The hip joints are read off the body at the posture's heading and pelvis, so the root follows from them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hips' own angles count, so a hiked pelvis keeps its middle where asked.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function rootFor(
    body: IHumanBody,
    tilted: IHumanPosture,
    hips: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const joints = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      resolveHumanPosture.heading(tilted),
      tilted.joints.hips,
    );
    return Vector3.subtract(hips, Vector3.lerp(joints.left, joints.right, 0.5));
  }
}
