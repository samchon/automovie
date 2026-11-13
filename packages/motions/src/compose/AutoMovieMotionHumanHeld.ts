import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGrip } from "../handling/HumanGrip";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/**
 * The prop a hand holds as an action enters, in that hand's own frame: the
 * one reading every action that works with a held thing starts from, whether
 * it brings a glass's lip to the mouth or a blade's point to a target.
 *
 * A held prop is rigid in the hand from the instant its grip closed, so the
 * prop's frame, and with it every point and direction the prop declares, is
 * a constant of the hand's grip frame for as long as it is held. The grip
 * frame is the performance's own: the grip socket's point with the hand
 * bone's rotation, the frame a held prop is carried in. It is read once, at
 * the action's entry, from the displayed prop and the displayed hand, so an
 * action aims what the film shows whichever way the hand took the prop.
 *
 * Whether the hand holds the prop is the entry state's fact
 * (`IHumanEntryState.holds`), never a judgment from how near it lies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, when, in which frame, why it stays constant and where the fact of holding comes from.
 * @evidence contracts/development/design.md#principled-representation A held thing is a rigid offset in the hand's frame (inverse(hand) times object, captured once), the parent constraint of the motion skill's held-object rule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The held record, its reading, a declared point and direction in the hand's frame, and the grip window and hold that keep the prop held; read by the hand-to-face and striking families, which add their own effector and tool on top.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named: points are the prop's own affordance ids, and a missing one is refused with the ids the prop has.
 */
export namespace AutoMovieMotionHumanHeld {
  /**
   * A prop in the hand that holds it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, the frame of `frame` and that `affordances` are in the prop's own frame.
   * @evidence contracts/development/design.md#principled-representation The prop's subject id, the holding side, the prop's rigid offset in the hand's grip frame (metres and a rotation) and its declared contacts, the facts every held-thing action starts from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read through `of` and the point and direction readers by the handling and striking laws, the workout load and the pole vault; the affordances are the interface package's own type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named; the side is the closed `"left" | "right"` union and `frame` reuses `IHumanProp.IFrame`.
   */
  export interface IHeld {
    /** The prop's subject id. */
    prop: string;

    /** The holding hand. */
    side: "left" | "right";

    /** The prop's frame in the hand's grip frame: its origin from the grip socket in the hand bone's axes, metres, and its rotation from the hand bone's. */
    frame: IHumanProp.IFrame;

    /** The prop's contacts, in its own frame. */
    affordances: readonly IAutoMovieAffordance[];
  }

  /**
   * Read the prop a hand holds at an action's entry.
   *
   * @param context The action's context.
   * @param side The holding hand.
   * @param prop The prop's subject id.
   * @returns The prop in the hand's grip frame.
   * @throws {HumanRefusal} An `affordance` refusal when that hand does not hold that prop at the entry, naming what it holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the result's frame and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The prop's displayed frame at the entry second taken into the displayed hand's grip frame (inverse(hand) times prop), the offset the performance itself keeps while the grip holds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The fact of holding, then one change of frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A prop that is not in the hand is refused instead of being carried from where it lies.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward kinematics of the entry pose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop">,
    side: "left" | "right",
    prop: string,
  ): IHeld {
    const held: string | undefined = context.entry.holds[side];
    if (held !== prop)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: prop,
        feasible: {
          kind: "alternatives",
          values: held === undefined ? [] : [held],
        },
        reason: `the ${side} hand ${held === undefined ? "holds nothing" : `holds ${held}`}, not ${prop}`,
        fix: `pick ${prop} up with the ${side} hand first, or perform the action with the hand that holds it`,
      });
    const read: IHumanActionContext.IProp = context.prop(prop);
    const world: IHumanProp.IFrame = read.frame(context.entry.seconds);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
    );
    const rotation: IAutoMovieQuaternion | undefined = bones.get(
      `${side}Hand`,
    )?.worldRotation;
    if (rotation === undefined)
      throw new Error(`The body has no ${side} hand bone`);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
    return {
      prop,
      side,
      frame: {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(
            world.position,
            HumanHand.frame(context.body, bones, side, "grip").point,
          ),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, world.rotation),
        ),
      },
      affordances: read.prop.affordances ?? [],
    };
  }

  /**
   * One of the prop's contacts in the hand's grip frame.
   *
   * @param held The held prop.
   * @param id The affordance's id.
   * @returns Its point from the grip socket, metres, and the unit direction its `+Y` runs, both in the hand bone's axes.
   * @throws {HumanRefusal} An `affordance` refusal when the prop declares no such contact, listing the ones it has.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the two results with their frame and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation An affordance's translation is its point and its rotated `+Y` its outward direction, the affordance record's own convention, each carried by the held frame's rigid transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing contact is refused, never replaced by the prop's origin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the prop's few contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    held: IHeld,
    id: string,
  ): { point: IAutoMovieVector3; direction: IAutoMovieVector3 } {
    const found: IAutoMovieAffordance | undefined = held.affordances.find(
      (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "point",
        value: `${held.prop}.${id}`,
        feasible: {
          kind: "alternatives",
          values: held.affordances.map(
            (affordance: IAutoMovieAffordance): string => affordance.id,
          ),
        },
        reason: `${held.prop} declares no contact named ${id}`,
        fix: "name one of the prop's contacts, or hold a prop that declares it",
      });
    return {
      point: Vector3.add(
        held.frame.position,
        Quaternion.rotateVector(held.frame.rotation, found.frame.translation),
      ),
      direction: Vector3.normalize(
        Quaternion.rotateVector(
          held.frame.rotation,
          Quaternion.rotateVector(found.frame.rotation, { x: 0, y: 1, z: 0 }),
        ),
      ),
    };
  }

  /**
   * The grip window that keeps the prop in its hand through a whole action.
   *
   * @param held The held prop.
   * @returns The contact window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the window does.
   * @evidence contracts/development/implementation.md#principled-implementation A held hand may be driven only by an action that declares a grip on its prop, the performance's rule; the window spans the action, so the prop never leaves the hand in it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function grip(held: IHeld): IHumanContactWindow {
    return {
      part: `${held.side}Hand`,
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: held.prop },
    };
  }

  /**
   * The hold the prop is left in when the action ends, with the fingers the
   * hand had closed on it at the entry.
   *
   * @param context The action's context.
   * @param held The held prop.
   * @returns The hold for the plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is left held and with which fingers.
   * @evidence contracts/development/implementation.md#principled-implementation The action's grip window ends the earlier hold, so it leaves a hold of its own from its start; the fingers are the displayed ones, which the grip closed until contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fingers are read from the entry pose, never closed again, so the hand does not re-seat what it holds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One scan of the entry pose's joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanGrip.fingers`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hold(
    context: Pick<IHumanActionContext, "entry">,
    held: IHeld,
  ): IHumanActionPlan.IHold {
    return {
      side: held.side,
      prop: held.prop,
      from: 0,
      fingers: HumanGrip.fingers(context.entry.pose, held.side),
    };
  }
}
