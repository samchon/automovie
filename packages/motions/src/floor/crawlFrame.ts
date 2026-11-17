import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanArmAngles, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "@automovie/engine";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { floorEntry } from "./floorEntry";

/**
 * The pieces the crawls on the hands share: where a wrist stands over its
 * flat palm, the palms laid on their floor points, a body tilted forward by
 * a pitch with its pelvis turned about the spine's axis, the root that
 * puts the hip joints' middle at a place, the arms carried in joint space,
 * the hips over two knees, and the search for the pitch that brings the
 * shoulders to their place; the feet are `crawlFeet`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seven pieces and what each gives.
 * @evidence contracts/development/design.md#principled-representation Pure functions of the body and a posture, shared by the crawl's kinds and its way down.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seven functions, the one share they use and the pitch search's range.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is solved on the body; nothing is a length typed in metres.
 */
export namespace crawlFrame {
  /** The chest's share of the turn that levels the shoulders over a hiked pelvis; the lumbar spine takes the rest (as `AutoMovieMotionHumanTrunk.CHEST`). */
  export const CHEST: number = 0.6;

  /** The most a crawl's trunk is pitched in a search, degrees: past horizontal, beyond any body on its hands. */
  export const PITCH: number = 120;

  /** The halvings of a pitch search: `PITCH` to under a ten-thousandth of a degree. */
  export const HALVINGS: number = 24;

  /**
   * The trunk's pitch at which a reading of the body stops holding, sought
   * between upright and `PITCH`.
   *
   * @param short Whether the shoulders still fall short of their place at a pitch, degrees; true at upright and false past the place.
   * @returns The pitch, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the search, its range and the reading's sense.
   * @evidence contracts/development/implementation.md#principled-implementation Bisection needs only the reading's change of sense over the range, which a trunk pitched toward the floor gives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range and the halvings are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HALVINGS` readings.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The crawl's pitch and the way down's lean are both found by it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pitched(short: (degrees: number) => boolean): number {
    let lo: number = 0;
    let hi: number = PITCH;
    for (let i: number = 0; i < HALVINGS; i++) {
      const mid: number = (lo + hi) / 2;
      if (short(mid)) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

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
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    palm: (side: "left" | "right") => IAutoMovieVector3,
    forward: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    let out: IAutoMovieMotionHumanPosture = posture;
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
   * A posture with both arms written by their joints, carried in joint space
   * from held angles toward others by a share, each hand shaped flat with
   * them (`HumanHand.shape`), and the arms' goals removed.
   *
   * @param body The body.
   * @param posture The posture.
   * @param held Each arm's angles at share 0.
   * @param toward Each arm's angles at share 1.
   * @param share The share, in [0, 1].
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Free arm movements are smooth in joint space (Soechting and Lacquaniti 1981), so the arm is blended between two sets of angles (`blendHumanJoint`), never re-solved toward a goal that moves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three blended joints and the fingers per arm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fingers start from the held ones, or the posture's where the arm holds none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function armed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    held: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const from: IAutoMovieMotionHumanArmAngles.IAngles = held[side];
      const to: IAutoMovieMotionHumanArmAngles.IAngles = toward[side];
      for (const [bone, key] of [
        [`${side}UpperArm`, "upper"],
        [`${side}LowerArm`, "lower"],
        [`${side}Hand`, "hand"],
      ] as const)
        joints[bone] = blendHumanJoint(body, bone, from[key], to[key], share);
      const flat: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, "flat");
      const was: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const bone of Object.keys(flat) as AutoMovieHumanoidBone[]) {
        const held: readonly [number, number, number] | undefined =
          from.fingers?.[bone] ?? posture.joints[bone];
        if (held !== undefined) was[bone] = held;
      }
      Object.assign(joints, floorEntry.blended(was, flat, share));
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }
  /**
   * The body tilted forward by a pitch at a share of the way down, its
   * pelvis turned about the spine's axis and the spine and the chest
   * turning it back, the arms hanging as the body's relaxed arms
   * (`stand.relaxed`).
   *
   * @param body The body.
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
    body: IAutoMovieMotionHumanBody,
    yaw: number,
    share: number,
    degrees: number,
    hike: number,
    neck: number,
  ): IAutoMovieMotionHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw,
      pitch: degrees * share,
      roll: 0,
      joints: {
        ...stand.relaxed(body),
        neck: [neck * share, 0, 0],
        hips: [0, 0, hike],
        spine: [0, 0, -(1 - CHEST) * hike],
        chest: [0, 0, -CHEST * hike],
      },
      limbs: {},
    };
  }

  /**
   * The hips over two knees: each hip joint a thigh from its knee, at its
   * place along the heading from a level point, so their middle is the
   * pelvis's height and their difference its turn about the spine's axis.
   *
   * @param thigh The thigh's length, metres.
   * @param level The hips' middle on the floor, world metres.
   * @param forward The heading's unit vector.
   * @param knees Each knee joint, world metres.
   * @param ahead How far each hip joint lies before the level point, metres along the heading.
   * @param separation The hip joints' distance, metres.
   * @param pitch The trunk's pitch, degrees.
   * @returns The hips' middle, world metres, and the pelvis's turn, degrees, positive lifting the left hip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, each input, its unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Each hip joint's height is the thigh's reach over its knee; a pelvis pitched by the trunk lifts one hip over the other by turning about the spine's axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One height per side and one turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An upright pelvis cannot lift a hip by that turn, so it turns none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function over(
    thigh: number,
    level: IAutoMovieVector3,
    forward: IAutoMovieVector3,
    knees: Record<"left" | "right", IAutoMovieVector3>,
    ahead: Record<"left" | "right", number>,
    separation: number,
    pitch: number,
  ): { point: IAutoMovieVector3; hike: number } {
    const height = (side: "left" | "right"): number => {
      const along: number =
        Vector3.dot(Vector3.subtract(knees[side], level), forward) -
        ahead[side];
      return (
        knees[side].y + Math.sqrt(Math.max(0, thigh * thigh - along * along))
      );
    };
    const left: number = height("left");
    const right: number = height("right");
    const reach: number = separation * Math.sin((pitch * Math.PI) / 180);
    return {
      point: { ...level, y: (left + right) / 2 },
      hike:
        reach === 0
          ? 0
          : (Math.asin(Math.max(-1, Math.min(1, (left - right) / reach))) *
              180) /
            Math.PI,
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
    body: IAutoMovieMotionHumanBody,
    tilted: IAutoMovieMotionHumanPosture,
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
