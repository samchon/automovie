import {
  Quaternion,
  Vector3,
  minimumJerk,
  physicalShapeBounds,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRegrasp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanGrasp } from "./HumanGrasp";

/**
 * A held object moved within or with the hand that holds it, without being put
 * down: turned about one of its own axes (a key in a lock, a cap), shifted to
 * another of its grips (a pen turned into a writing grip, a phone from a carry
 * grip to a texting grip), or rolled across the fingers (a coin). Rows name
 * each kind (`HumanRegrasp`).
 *
 * `twist`: the wrist does the turn and the grip holds. The hand, and the object
 * riding it with the offset stored at closure, rotate together about the
 * object's axis line, an affordance whose translation lies on the axis and
 * whose `+X` is its direction, so the object turns about its own axis only; the
 * angle is counter-clockwise looking down the axis.
 *
 * `regrip`: the object moves in the still hand from the grip it is held by to
 * the grip a named affordance takes (`HumanGrasp.hand`, the grip a pick-up of
 * that affordance would close), as the grip window's in-hand motion
 * (`HumanContactWindow.inHand`): its origin on a straight line in the hand and
 * its rotation along the shortest arc, both on one minimum-jerk profile.
 *
 * `roll`: the object rolls without slipping from the forefinger's pad to the
 * little finger's across the relaxed hand, turning about the palm's normal by
 * the distance over its radius (the affordance `axis`'s `radius`).
 *
 * This is the first pass the in-hand manipulation issue states for when the
 * literature gives no deterministic finger-gaiting rule that fits: the digits
 * keep the hand's shape while the object moves, so no digit lifts and replaces;
 * a schedule of digit contacts waits on that rule. A turn beyond the forearm's
 * range would need such regrips between turns.
 *
 * Every kind follows a minimum-jerk profile (Flash and Hogan 1985). Its
 * duration is 0.6 s for a quarter turn, a grip change or a roll across the hand
 * (provisional: a search for measured key-turning and in-hand manipulation
 * times found none), a twist's in proportion to its angle. The hand must hold
 * the object at entry, or the act is refused. Event `done` at the end; the hand
 * keeps the object after.
 */
export namespace regrasp {
  /** The law's name, as productions register it. */
  export const name: string = "regrasp";

  /** Cancel table: none declared. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};
  /**
   * Plan the act.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hand does not hold the object, a kind's
   *   input is missing or names no affordance, or a twist's angle is none or
   *   not finite.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRegrasp.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const { prop: subject, hand: side, kind } = context.params;
    if (context.entry.holds[side] !== subject)
      throw new HumanRefusal({
        kind: "base",
        axis: "hand",
        value: side,
        reason: `the ${side} hand does not hold ${subject} at the act's start`,
        fix: "take the object up in that hand first",
      });
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const frame: IAutoMovieRigidTransform = read.frame(context.start);
    const placed: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    ).get(`${side}Hand`)!;
    const hand: IAutoMovieRigidTransform = {
      position: placed.worldPosition,
      rotation: placed.worldRotation,
    };
    const hold: IAutoMovieMotionHumanPosture = context.entry.posture;
    const limb: AutoMovieHumanLimb = `${side}Arm`;
    const still: IAutoMovieHumanLimbGoal = {
      ...(hold.limbs[limb] ?? {
        bend: Vector3.add(hand.position, { x: 0, y: -1, z: 0 }),
      }),
      point: hand.position,
      rotation: hand.rotation,
    };
    // The hand is no longer choosing a pickup posture. Its new goal has a
    // world-space axis; the preceding grasp's elbow selection and joint
    // reference would compete with the rotation that keeps that line fixed.
    const {
      reference: _reference,
      elbow: _elbow,
      on: _on,
      clearanceOn: _clearanceOn,
      ...twisting
    }: IAutoMovieHumanLimbGoal = still;
    const angle: number =
      kind === "twist" ? need(context.params.angle, "angle") : 90;

    // A twist's time is in proportion to its angle, so a twist of none has
    // no time to turn in.
    if (!(Math.abs(angle) > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "angle",
        value: angle,
        reason:
          "a twist turns the held object by a finite angle other than none",
        fix: "give the twist's angle in degrees, positive or negative",
      });
    const duration: number = (QUARTER * Math.abs(angle)) / 90;
    const window: IAutoMovieMotionHumanContactWindow = {
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
      minimumJerk.share(Math.min(1, Math.max(0, seconds / duration)));

    // A twist turns the hand rigidly about the object's axis line.
    const axis: OptionalAxis =
      kind === "twist"
        ? line(read.prop, frame, need(context.params.axis, "axis"))
        : null;
    const contact: IAutoMovieVector3 | undefined =
      axis === null
        ? undefined
        : Quaternion.rotateVector(
            Quaternion.inverse(hand.rotation),
            Vector3.subtract(axis.pivot, hand.position),
          );
    const orbit: IAutoMovieVector3 | undefined =
      axis === null ? undefined : Vector3.subtract(hand.position, axis.pivot);
    const turning: ReturnType<typeof Quaternion.prepareAxisAngle> | undefined =
      axis === null ? undefined : Quaternion.prepareAxisAngle(axis.direction);
    return {
      duration,
      events: [{ name: "done", share: 1 }],
      contacts: [window],
      holds: [{ side, prop: subject, from: 1 }],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        if (axis === null)
          return { ...hold, limbs: { ...hold.limbs, [limb]: still } };
        const turn: IAutoMovieQuaternion = turning!(angle * profile(seconds));
        return {
          ...hold,
          limbs: {
            ...hold.limbs,
            [limb]: {
              ...twisting,

              // The object turns about its axis, so that axis point is the
              // contact the fit must keep when the wrist gives up rotation.
              contact: contact!,
              point: Vector3.add(
                axis.pivot,
                Quaternion.rotateVector(turn, orbit!),
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
   * frame that, composed before the offset the grip stored (R_d p + t_d, R_d
   * R), carries the object from where it is held to its end.
   *
   * @param context The action's context.
   * @param prop The held object.
   * @param frame Its world frame at the act's start.
   * @param hand The hand's world frame at the act's start.
   * @returns The displacement by share.
   */
  export function inHand(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRegrasp.IParams>,
    prop: IAutoMovieMotionHumanProp,
    frame: IAutoMovieRigidTransform,
    hand: IAutoMovieRigidTransform,
  ): NonNullable<IAutoMovieMotionHumanContactWindow["inHand"]> {
    const { hand: side, kind } = context.params;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.rotation);

    // Where it is held now, in the hand's frame.
    const start: IAutoMovieRigidTransform = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(frame.position, hand.position),
      ),
      rotation: Quaternion.multiply(inverse, frame.rotation),
    };
    let end: IAutoMovieRigidTransform;
    if (kind === "regrip") {
      const wrist: IAutoMovieMotionHumanHand.IWrist = HumanGrasp.hand(
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
    const turning: ReturnType<typeof Quaternion.prepareSlerp> =
      Quaternion.prepareSlerp(Quaternion.identity(), arc);
    return (share: number): IAutoMovieRigidTransform => {
      const s: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
      const rotation: IAutoMovieQuaternion = turning(s);
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

/**
 * Seconds for a quarter turn, a grip change or a roll across the hand
 * (provisional: no measured key-turning or in-hand manipulation time was
 * found).
 */
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
const site: (
  prop: IAutoMovieMotionHumanProp,
  id: string,
) => IAutoMovieAffordance = (
  prop: IAutoMovieMotionHumanProp,
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

/** The pivot on the affordance's axis and that axis's world direction. */
interface IAxis {
  pivot: IAutoMovieVector3;
  direction: IAutoMovieVector3;
}

/** A turn has an axis, while a regrip or roll has only an in-hand transform. */
type OptionalAxis = IAxis | null;

/**
 * The affordance's +X line in the world. In exact rotation any point on this
 * line defines the same transform. Pin the midpoint of the projected extent of
 * the prop and its affordance so any orientation error has the shortest
 * possible maximum lever arm to either end of that extent.
 */
const line: (
  prop: IAutoMovieMotionHumanProp,
  frame: IAutoMovieRigidTransform,
  id: string,
) => IAxis = (
  prop: IAutoMovieMotionHumanProp,
  frame: IAutoMovieRigidTransform,
  id: string,
): IAxis => {
  const affordance: IAutoMovieAffordance = site(prop, id);
  const oriented: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    affordance.frame.rotation,
  );
  const direction: IAutoMovieVector3 = Quaternion.rotateVector(oriented, {
    x: 1,
    y: 0,
    z: 0,
  });
  let low: number = 0;
  let high: number = 0;
  if (prop.shapes !== undefined && prop.shapes.length !== 0) {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      affordance.frame.rotation,
    );
    const relative: IAutoMovieRigidTransform = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.scale(affordance.frame.translation, -1),
      ),
      rotation: inverse,
    };
    for (const shape of prop.shapes) {
      const bounds: ReturnType<typeof physicalShapeBounds> =
        physicalShapeBounds(relative, shape);
      low = Math.min(low, bounds.min.x);
      high = Math.max(high, bounds.max.x);
    }
  }
  return {
    pivot: Vector3.add(
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
      ),
      Vector3.scale(direction, (low + high) / 2),
    ),
    direction,
  };
};
