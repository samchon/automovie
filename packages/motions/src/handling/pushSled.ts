import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { walk } from "../actions/walk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A pushed load's handles held in both hands through a walk: a sled push.
 * The body walks as the walk law plans it to `to`, slowly and with no arm
 * swing; the trunk leans into the load, the hands go to the two
 * handles where the load stands, close on them, and from then on are carried
 * with the chest along the floor at the handles' own height, so the load,
 * gripped, goes where the hands go, as a held prop does, and stays on the
 * floor while the arms take the walk's rise and fall.
 *
 * The lean is a flexion of the spine and the chest by `lean` degrees (half
 * each), coming in over `SETTLE` seconds with the arms; the hands reach the
 * handles in that time and grip them from its end. Each hand's place on its
 * handle is then kept in the chest's frame for the rest of the push.
 *
 * First pass: the load slides with the grip and is not dragged by a
 * friction; the push's force and the slowing it brings to the walk are not
 * modelled.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lean, how the hands come to the handles and stay, how the load moves and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A walk with both arms and a trunk lean written over it, the load moved by the grip relation every held prop has; not an overlay, since a walk does not yield its trunk.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, one constant, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are the prop's own affordances, read where the prop stands.
 */
export namespace pushSled {
  /** The action's name. */
  export const name: HumanActionKey = "pushSled";

  /** Cancel table: the push may be left at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** Seconds to lean in and take the handles (provisional). */
  export const SETTLE: number = 0.6;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The load, its two handles, the lean and the length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are named affordances of the prop.
   */
  export interface IParams {
    /** The pushed prop's subject id. */
    sled: string;

    /** Where the walk goes, world metres. */
    to: IAutoMovieVector3;

    /** The handle the left hand takes, an affordance id; `left` when absent. */
    left?: string;

    /** The handle the right hand takes, an affordance id; `right` when absent. */
    right?: string;

    /** How far the trunk leans into the load, degrees in [0, 60]; 30 when absent (provisional). */
    lean?: number;

  }

  /**
   * Plan a push.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the lean is out of range, the walk is shorter than the settle, or the prop lacks a named handle; and whatever the walk refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The handles are read on the prop's frame at the start; each hand's place on its handle is taken into the leaning chest's frame where the hands arrive and carried with it after, so the load follows the trunk through the grip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The handles, the lean, the chest-held places, the contacts, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bounds refuse; a missing handle refuses with the prop's handles.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolve and one posture resolve per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the walk law, the trunk resolver, the arm carry and the grip relation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan and the held places.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const lean: number = p.lean ?? 30;
    HumanBound.within("lean", lean, 0, 60, "degrees");

    const read: IHumanActionContext.IProp = context.prop(p.sled);
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const handle = (id: string): IAutoMovieVector3 => {
      const found: IAutoMovieAffordance | undefined = (
        read.prop.affordances ?? []
      ).find((a: IAutoMovieAffordance): boolean => a.id === id);
      if (found === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "handle",
          value: `${p.sled}.${id}`,
          feasible: {
            kind: "alternatives",
            values: (read.prop.affordances ?? []).map(
              (a: IAutoMovieAffordance): string => a.id,
            ),
          },
          reason: `${p.sled} has no handle named ${id}`,
          fix: "name the prop's handles as `left` and `right`",
        });
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, found.frame.translation),
      );
    };
    const handles: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: handle(p.left ?? "left"),
      right: handle(p.right ?? "right"),
    };
    const walking: IHumanActionContext<walk.IParams> = {
      ...context,
      params: { to: p.to, pace: "slow", armSwing: 0 },
    } as IHumanActionContext<walk.IParams>;
    const base: IHumanActionPlan = walk.plan(walking);
    const duration: number = base.duration;
    HumanBound.above("walk", duration, SETTLE, "s");

    // The lean, a share of the way in.
    const leaned = (posture: IHumanPosture, share: number): IHumanPosture => {
      const joints: IHumanPosture["joints"] = { ...posture.joints };
      for (const bone of ["spine", "chest"] as const) {
        const was: readonly [number, number, number] = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [was[0] + (lean / 2) * share, was[1], was[2]];
      }
      return { ...posture, joints };
    };
    const chest = (posture: IHumanPosture) =>
      HumanTrunk.resolve(body, posture).get("chest")!;
    const elbow = (
      posture: IHumanPosture,
      side: HumanHand.Side,
    ): IAutoMovieVector3 => {
      const c = chest(posture);
      return Vector3.add(
        c.worldPosition,
        Quaternion.rotateVector(c.worldRotation, {
          x: (side === "left" ? 1 : -1) * 0.35,
          y: -0.3,
          z: 0,
        }),
      );
    };

    // Each hand's place in the leaning chest's frame where it arrives.
    const arrived = chest(leaned(base.posture(SETTLE), 1));
    const inverse = Quaternion.inverse(arrived.worldRotation);
    const held: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(handles.left, arrived.worldPosition),
      ),
      right: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(handles.right, arrived.worldPosition),
      ),
    };
    // Each hand's turn where it takes its handle, kept through the push so
    // the gripped load does not tilt with the arms.
    const goals = (posture: IHumanPosture): IHumanPosture["limbs"] => ({
      ...posture.limbs,
      leftArm: { point: handles.left, bend: elbow(posture, "left") },
      rightArm: { point: handles.right, bend: elbow(posture, "right") },
    });
    const taking: IHumanPosture = leaned(base.posture(SETTLE), 1);
    const taken = poseBones(
      body,
      resolveHumanPosture(body, { ...taking, limbs: goals(taking) }),
    );
    const turns: Record<HumanHand.Side, IAutoMovieQuaternion> = {
      left: taken.get("leftHand")!.worldRotation,
      right: taken.get("rightHand")!.worldRotation,
    };
    const fist = {
      ...HumanHand.shape("left", "fist"),
      ...HumanHand.shape("right", "fist"),
    };
    const sides: HumanHand.Side[] = ["left", "right"];
    return {
      duration,
      events: [...base.events, { name: "gripped", share: SETTLE / duration }],
      contacts: [
        ...base.contacts,
        ...sides.map(
          (side: HumanHand.Side): IHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: SETTLE / duration,
            to: 1,
            support: { kind: "prop", subject: p.sled },
          }),
        ),
      ],
      hands: sides,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const share: number = minimumJerk(Math.min(1, t / SETTLE)).s;
        const posture: IHumanPosture = leaned(base.posture(t), share);
        const c = chest(posture);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of sides) {
          // Carried with the chest along the floor, at the handle's own
          // height: the load stays on the floor, the arms take the walk's
          // rise and fall.
          const carried: IAutoMovieVector3 = Vector3.add(
            c.worldPosition,
            Quaternion.rotateVector(c.worldRotation, held[side]),
          );
          const point: IAutoMovieVector3 =
            t < SETTLE
              ? handles[side]
              : { x: carried.x, y: handles[side].y, z: carried.z };
          limbs[`${side}Arm`] = {
            point,
            ...(t >= SETTLE ? { rotation: turns[side] } : {}),
            bend: elbow(posture, side),
          };
        }
        const walked = resolveHumanPosture(body, posture);
        return AutoMovieMotionHumanArm.carry(
          body,
          {
            ...posture,
            joints: { ...posture.joints, ...(t >= SETTLE ? fist : {}) },
            limbs,
          },
          {
            left: AutoMovieMotionHumanArm.angles(walked, "left"),
            right: AutoMovieMotionHumanArm.angles(walked, "right"),
          },
          share,
        );
      },
    };
  }
}
