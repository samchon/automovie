import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { StrikingHeld } from "../striking/StrikingHeld";

/**
 * The load a workout is done with: a prop the performer already holds (a
 * barbell, a dumbbell, a kettlebell taken by `pickUp`), carried through the
 * exercise's keys instead of being refused.
 *
 * The hand that holds keeps its grip: the plan declares the grip and
 * leaves the hold as it found it, so the prop rides that hand. A prop held
 * in one hand asks no more. A prop with a second handle (a bar) is laid
 * level: the holding hand stays where the key's arm puts it and is turned
 * so the line to the other handle runs to the performer's other side with
 * the knuckles continuing the forearm, and
 * the other hand is laid on that handle by the arm's solve, as a long gun's
 * support hand is.
 *
 * First pass: the load weighs nothing in the motion (no lean, no slower
 * tempo, no bar path over the knees); a bar is kept level across the body
 * whatever the key, so a one-sided or turned carry is not written; the
 * holding hand's turn about the bar is the straight wrist's, whatever the
 * lift (no hook or mixed grip).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a load is, how each hand is driven and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation The held owner's grip and hold with the stroke planner's held-tool frame, so a bar in two hands is the same construction as a blade or a long gun in two.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The load's parameters and the one record the workout law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop must already be held, by the grammar's own pick-up; the law grasps nothing itself.
 */
export namespace WorkoutLoad {
  /** The load's parameters. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** The hand that holds it; `right` when absent. */
    hand?: HumanHand.Side;

    /** The prop's affordance the other hand takes (a bar's second handle); one hand holds when absent. */
    other?: string;
  }

  /** What a load gives the workout's plan. */
  export interface ILoad {
    /**
     * The posture with its hands on the load.
     *
     * @param posture The posture the exercise's key gives.
     * @returns The same posture with the holding arms' goals.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
     * @evidence contracts/development/implementation.md#principled-implementation The key places the body and the holding hand; this turns the hand to level the load and lays the other hand on its handle.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One call per evaluated posture.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A one-handed load changes the holding hand's fingers only, stated on the namespace.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
     */
    apply(posture: IHumanPosture): IHumanPosture;

    /** The grip's contact window. */
    contacts: IHumanContactWindow[];

    /** The hold the action leaves as it found it. */
    holds: IHumanActionPlan.IHold[];

    /** The hands the load drives. */
    hands: HumanHand.Side[];
  }

  /**
   * The load of a workout.
   *
   * @param context The action's context.
   * @param load The load's parameters.
   * @returns What the plan needs of it.
   * @throws {HumanRefusal} When the hand does not hold the prop, or the prop lacks the other handle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation One hand: the held owner's grip and hold. Two hands: the stroke planner's tool whose working point is the other handle; the holding hand's grip socket is kept where the key's joints put it and the tool's line is turned level toward the other side, then the other hand is placed on the working point with its knuckles the way the holding hand's face.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the hold once, then one frame and two arm goals per posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The refusals are the held owner's and the tool's own; nothing is grasped here.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics and two elbow solves per posture with a second hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the held owner, the held tool's frame and goal, the hand's placement and the elbow solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record closes over the tool read at plan time.
   */
  export function of(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "subject">,
    load: IParams,
  ): ILoad {
    const body: IHumanActionContext["body"] = context.body;
    const side: HumanHand.Side = load.hand ?? "right";
    const other: HumanHand.Side = side === "right" ? "left" : "right";

    // The holding hand keeps the fingers it closed on the prop: a key
    // writes every joint, the fingers among them.
    const closed: IHumanPosture["joints"] = Object.fromEntries(
      Object.entries(context.entry.posture.joints).filter(
        ([bone]: [string, unknown]): boolean =>
          bone.startsWith(side) &&
          /(Thumb|Index|Middle|Ring|Little)/.test(bone),
      ),
    );
    if (load.other === undefined) {
      const held: ReturnType<typeof AutoMovieMotionHumanHeld.of> =
        AutoMovieMotionHumanHeld.of(context, side, load.prop);
      return {
        apply: (posture: IHumanPosture): IHumanPosture => ({
          ...posture,
          joints: { ...posture.joints, ...closed },
        }),
        contacts: [AutoMovieMotionHumanHeld.grip(held)],
        holds: [AutoMovieMotionHumanHeld.hold(context, held)],
        hands: [side],
      };
    }
    const tool: StrikingHeld.ITool = StrikingHeld.of(context, side, load.prop, {
      tip: load.other,
    });
    const own: StrikingHeld.ITool = StrikingHeld.of(context, side);
    const bare: StrikingHeld.ITool = StrikingHeld.of(context, other);
    const bend = (
      posture: IHumanPosture,
      arm: HumanHand.Side,
      goal: Pick<IHumanPosture.IGoal, "point" | "rotation">,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.solve({
        body,
        posture,
        side: arm,
        point: goal.point,
        ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
        fallback: "hang",
      });
    return {
      contacts: StrikingHeld.grips(tool),
      holds: StrikingHeld.holds(context, tool),
      hands: [side, other],
      apply: (posture: IHumanPosture): IHumanPosture => {
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          StrikingBody.trunk(body, posture);
        // The bar runs level to the performer's other side from the hand,
        // and the hand is turned about it so the knuckles continue the
        // forearm: a straight wrist, the turn an arm holds. A turn taken
        // from the key's own hand left the bar 0.3 m out of level, the
        // wrist giving way.
        const across: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
          { x: side === "right" ? 1 : -1, y: 0, z: 0 },
        );
        const forearm: IAutoMovieVector3 = Vector3.subtract(
          bones.get(`${side}Hand`)!.worldPosition,
          bones.get(`${side}LowerArm`)!.worldPosition,
        );
        const square: IAutoMovieVector3 = Vector3.subtract(
          forearm,
          Vector3.scale(across, Vector3.dot(forearm, across)),
        );
        const turn: IAutoMovieQuaternion = HumanHand.align(
          { normal: tool.axis, forward: own.axis },
          {
            normal: across,
            forward:
              Vector3.length(square) > 1e-6
                ? Vector3.normalize(square)
                : { x: 0, y: -1, z: 0 },
          },
        );
        const frame: StrikingHeld.IHandFrame = {
          point: HumanHand.frame(body, bones, side, "grip").point,
          rotation: turn,
        };
        const first: IHumanPosture.IGoal = StrikingHeld.goal(
          context,
          tool,
          frame,
          tool.length,
          { x: 0, y: 0, z: 0 },
        );
        const second: Omit<AutoMovieMotionHumanArm.ITarget, "bend"> = {
          surface: "grip",
          shape: "fist",
          ...StrikingHeld.hand(
            bare,
            0,
            StrikingHeld.point(tool, frame, 0),
            Quaternion.rotateVector(frame.rotation, own.axis),
            Quaternion.rotateVector(frame.rotation, own.edge),
          ),
        };
        const wrist: HumanHand.IWrist = HumanHand.place(
          body,
          other,
          "grip",
          second.point,
          second.rotation,
          "fist",
        );
        return {
          ...posture,
          joints: {
            ...posture.joints,
            ...closed,
            ...HumanHand.shape(other, "fist"),
          },
          limbs: {
            ...posture.limbs,
            [`${side}Arm`]: { ...first, bend: bend(posture, side, first) },
            [`${other}Arm`]: AutoMovieMotionHumanArm.goal(body, other, {
              ...second,
              bend: bend(posture, other, wrist),
            }),
          },
        };
      },
    };
  }
}
