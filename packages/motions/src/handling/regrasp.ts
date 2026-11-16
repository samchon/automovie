import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanGrasp } from "./HumanGrasp";

/**
 * A held object moved within or with the hand that holds it, without being
 * put down: turned about one of its own axes (a key in a lock, a cap), shifted
 * to another of its grips (a pen turned into a writing grip, a phone from a
 * carry grip to a texting grip), or rolled across the fingers (a coin). Rows
 * name each kind (`HumanRegrasp`).
 *
 * `twist`: the wrist does the turn and the grip holds. The hand, and the
 * object riding it with the offset stored at closure, rotate together about
 * the object's axis line, an affordance whose translation lies on the axis
 * and whose `+X` is its direction, so the object turns about its own axis
 * only; the angle is counter-clockwise looking down the axis.
 *
 * `regrip`: the object moves in the still hand from the grip it is held by to
 * the grip a named affordance takes (`HumanGrasp.hand`, the grip a pick-up
 * of that affordance would close), as the grip window's in-hand motion
 * (`IHumanContactWindow.inHand`): its origin on a straight line in the hand
 * and its rotation along the shortest arc, both on one minimum-jerk profile.
 *
 * `roll`: the object rolls without slipping from the forefinger's pad to the
 * little finger's across the relaxed hand, turning about the palm's normal
 * by the distance over its radius (the affordance `axis`'s `radius`).
 *
 * This is the first pass the in-hand manipulation issue states for when the
 * literature gives no deterministic finger-gaiting rule that fits (#3447): the
 * digits keep the hand's shape while the object moves, so no digit lifts and
 * replaces; a schedule of digit contacts waits on that rule. A turn beyond
 * the forearm's range would need such regrips between turns.
 *
 * Every kind follows a minimum-jerk profile (Flash and Hogan 1985). Its
 * duration is 0.6 s for a quarter turn, a grip change or a roll across the
 * hand (provisional: a search for measured key-turning and in-hand
 * manipulation times found none), a twist's in proportion to its angle. The
 * hand must hold the object at entry, or the act is refused. Event `done` at
 * the end; the hand keeps the object after.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's geometry, the first-pass scope, the frames and signs, the timing and its status, the refusal and the event.
 * @evidence contracts/development/design.md#principled-representation A law record over a held prop and a kind with its own inputs, with a pure plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan; rows fix the kind.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hold's stored offset, the grip window's in-hand motion and the grasp's own hand placement.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid turn of the wrist about the object's axis line, or the object's displacement in the hand interpolated between two grips' offsets, each on a minimum-jerk profile.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The start frames once, one branch per kind, then one profile per posture or share.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hand that does not hold the object, a missing input or an unknown affordance is refused; the provisional timing is named.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture after one forward kinematics at plan time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold the instance's inputs only.
 */
export namespace regrasp {
  /** The law's name, as productions register it. */
  export const name: string = "regrasp";

  /** Cancel table: none declared. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /** Parameters. */
  export interface IParams {
    /** What is done with the held object. */
    kind: "twist" | "regrip" | "roll";

    /** The held object. */
    prop: string;

    /** The hand that holds it. */
    side: HumanHand.Side;

    /** A twist's axis, or a roll's object: an affordance whose translation lies on the axis and whose `+X` is its direction; a roll reads its `radius`. */
    axis?: string;

    /** A twist's turn, degrees, counter-clockwise looking down the axis. */
    angle?: number;

    /** A regrip's new grip: the affordance the hand takes the object by. */
    to?: string;
  }

  /**
   * Plan the act.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hand does not hold the object, or a kind's input is missing or names no affordance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const { prop: subject, side, kind } = context.params;
    if (context.entry.holds[side] !== subject)
      throw new HumanRefusal({
        kind: "base",
        axis: "side",
        value: side,
        reason: `the ${side} hand does not hold ${subject} at the act's start`,
        fix: "take the object up in that hand first",
      });
    const read: IHumanActionContext.IProp = context.prop(subject);
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const placed: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
    ).get(`${side}Hand`)!;
    const hand: IHumanProp.IFrame = {
      position: placed.worldPosition,
      rotation: placed.worldRotation,
    };
    const hold: IHumanPosture = context.entry.posture;
    const limb: IHumanPosture.Limb = `${side}Arm`;
    const still: IHumanPosture.IGoal = {
      ...(hold.limbs[limb] ?? {
        bend: Vector3.add(hand.position, { x: 0, y: -1, z: 0 }),
      }),
      point: hand.position,
      rotation: hand.rotation,
    };
    const angle: number =
      kind === "twist" ? need(context.params.angle, "angle") : 90;
    const duration: number = (QUARTER * Math.abs(angle)) / 90;
    const window: IHumanContactWindow = {
      part: side === "left" ? "leftHand" : "rightHand",
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject },
      ...(kind === "twist"
        ? {}
        : { inHand: inHand(context, read.prop, frame, hand) }),
    };
    const profile: (seconds: number) => number = (seconds: number): number =>
      minimumJerk(Math.min(1, Math.max(0, seconds / duration))).s;

    // A twist turns the hand rigidly about the object's axis line.
    const axis: {
      pivot: IAutoMovieVector3;
      direction: IAutoMovieVector3;
    } | null =
      kind === "twist"
        ? line(read.prop, frame, need(context.params.axis, "axis"))
        : null;
    return {
      duration,
      events: [{ name: "done", share: 1 }],
      contacts: [window],
      holds: [{ side, prop: subject, from: 1 }],
      posture: (seconds: number): IHumanPosture => {
        if (axis === null)
          return { ...hold, limbs: { ...hold.limbs, [limb]: still } };
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          axis.direction,
          angle * profile(seconds),
        );
        return {
          ...hold,
          limbs: {
            ...hold.limbs,
            [limb]: {
              ...still,

              // The object turns about its axis, so that axis point is the
              // contact the fit must keep when the wrist gives up rotation.
              contact: Quaternion.rotateVector(
                Quaternion.inverse(hand.rotation),
                Vector3.subtract(axis.pivot, hand.position),
              ),
              point: Vector3.add(
                axis.pivot,
                Quaternion.rotateVector(
                  turn,
                  Vector3.subtract(hand.position, axis.pivot),
                ),
              ),
              rotation: Quaternion.normalize(
                Quaternion.multiply(turn, hand.rotation),
              ),
            },
          },
        };
      },
    };
  }

  /**
   * A regrip's or a roll's in-hand motion: the displacement d(s) in the hand's
   * frame that, composed before the offset the grip stored (R_d p + t_d,
   * R_d R), carries the object from where it is held to its end.
   *
   * @param context The action's context.
   * @param prop The held object.
   * @param frame Its world frame at the act's start.
   * @param hand The hand's world frame at the act's start.
   * @returns The displacement by share.
   */
  export function inHand(
    context: IHumanActionContext<IParams>,
    prop: IHumanProp,
    frame: IHumanProp.IFrame,
    hand: IHumanProp.IFrame,
  ): NonNullable<IHumanContactWindow["inHand"]> {
    const { side, kind } = context.params;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);

    // Where it is held now, in the hand's frame.
    const start: IHumanProp.IFrame = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(frame.position, hand.position),
      ),
      rotation: Quaternion.multiply(inverse, frame.rotation),
    };
    let end: IHumanProp.IFrame;
    if (kind === "regrip") {
      const wrist: HumanHand.IWrist = HumanGrasp.hand(
        context.body,
        side,
        HumanGrasp.at(prop, need(context.params.to, "to"), frame),
      );
      const back: IAutoMovieQuaternion = Quaternion.inverse(wrist.rotation);
      end = {
        position: Quaternion.rotateVector(
          back,
          Vector3.subtract(frame.position, wrist.point),
        ),
        rotation: Quaternion.multiply(back, frame.rotation),
      };
    } else {
      // A roll from the forefinger's pad to the little finger's, turning
      // about the palm's normal by the distance over the object's radius.
      const affordance: IAutoMovieAffordance = site(
        prop,
        need(context.params.axis, "axis"),
      );
      const radius: number = need(affordance.radius, "axis.radius");
      const from: IAutoMovieVector3 = HumanHand.offset(
        context.body,
        side,
        "indexPad",
        "relaxed",
      ).point;
      const to: IAutoMovieVector3 = HumanHand.offset(
        context.body,
        side,
        "littlePad",
        "relaxed",
      ).point;
      const across: IAutoMovieVector3 = Vector3.subtract(to, from);
      const palm: IAutoMovieVector3 =
        context.body.surfaces.sockets[
          side === "left" ? "palmLeft" : "palmRight"
        ].normal;
      const roll: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        palm,
        (Vector3.length(across) / radius) * (180 / Math.PI),
      );
      end = {
        position: Vector3.add(start.position, across),
        rotation: Quaternion.multiply(roll, start.rotation),
      };
    }
    const arc: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(end.rotation, Quaternion.inverse(start.rotation)),
    );
    return (share: number): IHumanProp.IFrame => {
      const s: number = minimumJerk(Math.min(1, Math.max(0, share))).s;
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        Quaternion.identity(),
        arc,
        s,
      );
      const position: IAutoMovieVector3 = Vector3.lerp(
        start.position,
        end.position,
        s,
      );
      return {
        position: Vector3.subtract(
          position,
          Quaternion.rotateVector(rotation, start.position),
        ),
        rotation,
      };
    };
  }
}

/** Seconds for a quarter turn, a grip change or a roll across the hand (provisional: no measured key-turning or in-hand manipulation time was found). */
const QUARTER: number = 0.6;

/** A required input, refused when absent. */
const need: <T>(value: T | undefined, axis: string) => T = <T>(
  value: T | undefined,
  axis: string,
): T => {
  if (value === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis,
      value: null,
      reason: `this kind of regrasp needs ${axis}`,
      fix: `give ${axis}`,
    });
  return value;
};

/** An affordance of the object, refused with its alternatives when absent. */
const site: (prop: IHumanProp, id: string) => IAutoMovieAffordance = (
  prop: IHumanProp,
  id: string,
): IAutoMovieAffordance => {
  const found: IAutoMovieAffordance | undefined = (prop.affordances ?? []).find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  if (found === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "axis",
      value: id,
      feasible: {
        kind: "alternatives",
        values: (prop.affordances ?? []).map(
          (a: IAutoMovieAffordance): string => a.id,
        ),
      },
      reason: `${prop.subject} has no affordance ${id}`,
      fix: "name an affordance of the object",
    });
  return found;
};

/** An affordance's axis line in the world: its translation and its `+X`. */
const line: (
  prop: IHumanProp,
  frame: IHumanProp.IFrame,
  id: string,
) => { pivot: IAutoMovieVector3; direction: IAutoMovieVector3 } = (
  prop: IHumanProp,
  frame: IHumanProp.IFrame,
  id: string,
): { pivot: IAutoMovieVector3; direction: IAutoMovieVector3 } => {
  const affordance: IAutoMovieAffordance = site(prop, id);
  return {
    pivot: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
    ),
    direction: Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, affordance.frame.rotation),
      { x: 1, y: 0, z: 0 },
    ),
  };
};
