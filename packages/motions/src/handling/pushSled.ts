import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { walk } from "../actions/walk";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
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
 * each), coming in over `SETTLE` seconds with the arms, and handles too low
 * for it are pushed from bent knees, the body sinking as far as keeps each
 * wrist within `SHORT` of the arm's full reach; the hands reach the
 * handles in that time and grip them from its end, each fist's grip socket
 * on its handle as a grasp lays it (`HumanHand.reach`: the palm into the
 * bar along the handle's `-Y`, the thumb's side along its `+X`, turned about
 * the handle as far as its symmetry makes the same grasp to whichever turn
 * the arm takes it at most nearly, AROUND), so the
 * handle is in the fist and the wrist a hand's half length off it. Each
 * hand's place is then kept in the chest's frame for the rest of the push,
 * its turn kept with it, and a turn the arm cannot meet gives way about the
 * grip socket, which stays on the handle.
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

  /** The share of the arm's full reach a pushing wrist is kept within, from its shoulder (provisional: the elbows a little bent, room for the gait's rise and fall). */
  export const SHORT: number = 0.9;

  /** The turns about a round handle tried for its grasp, degrees: the whole way round in steps of 30, the authored side first. */
  export const AROUND: readonly number[] = [
    0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180,
  ];

  /** How far a fist may stop short of its handle as the grip closes, metres: the campaign's 15 mm contact bound. */
  export const REACH: number = 0.015;

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
   * @throws {HumanRefusal} When the lean is out of range, the walk is shorter than the settle, the prop lacks a named handle, or a fist does not reach its handle as the grip closes; and whatever the walk refuses.
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
    const handle = (
      id: string,
    ): { frame: HumanHand.IFrame; symmetry: IAutoMovieAffordance["symmetry"] } => {
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
      // The hand arrives along the handle's -Y, the palm into the bar, and
      // wraps its +X, the thumb's side toward it (`HumanGrasp`).
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        frame.rotation,
        found.frame.rotation,
      );
      return {
        frame: {
          point: Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, found.frame.translation),
          ),
          normal: Quaternion.rotateVector(turn, { x: 0, y: -1, z: 0 }),
          forward: Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
        },
        symmetry: found.symmetry,
      };
    };
    const grips: Record<
      HumanHand.Side,
      ReturnType<typeof handle>
    > = {
      left: handle(p.left ?? "left"),
      right: handle(p.right ?? "right"),
    };
    const sockets: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: HumanHand.offset(body, "left", "grip", "fist").point,
      right: HumanHand.offset(body, "right", "grip", "fist").point,
    };
    const walking: IHumanActionContext<walk.IParams> = {
      ...context,
      params: { to: p.to, pace: "slow", armSwing: 0 },
    } as IHumanActionContext<walk.IParams>;
    const base: IHumanActionPlan = walk.plan(walking);
    const duration: number = base.duration;
    HumanBound.above("walk", duration, SETTLE, "s");

    // The lean, a share of the way in.
    // The lean, and the sink onto bent knees, a share of the way in.
    let sink: number = 0;
    const leaned = (posture: IHumanPosture, share: number): IHumanPosture => {
      const joints: IHumanPosture["joints"] = { ...posture.joints };
      for (const bone of ["spine", "chest"] as const) {
        const was: readonly [number, number, number] = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [was[0] + (lean / 2) * share, was[1], was[2]];
      }
      return {
        ...posture,
        joints,
        root: { ...posture.root, y: posture.root.y - sink * share },
      };
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

    // The load slides on the floor as one rigid thing with the hands that
    // hold it: carried along the floor with the chest's place and turned
    // with the chest's heading from where the hands arrive, never tilted by
    // the chest's sway, so both fists keep their places on it.
    const heading = (q: IAutoMovieQuaternion): number => {
      const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
        x: 0,
        y: 0,
        z: 1,
      });
      return (Math.atan2(f.x, f.z) * 180) / Math.PI;
    };
    // Handles below the reach of a leaning body are pushed from bent knees:
    // the body sinks as far as keeps each wrist `SHORT` of the arm's full
    // reach from its shoulder, room for the gait's rise and fall.
    {
      const standing: ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone
      > = poseBones(
        body,
        resolveHumanPosture(body, leaned(base.posture(SETTLE), 1)),
      );
      const short: number = SHORT * (body.measure.upperArm + body.measure.forearm);
      for (const side of ["left", "right"] as const) {
        const shoulder: IAutoMovieVector3 = standing.get(
          `${side}UpperArm`,
        )!.worldPosition;
        const wrist: IAutoMovieVector3 = HumanHand.reach(
          body,
          side,
          "grip",
          grips[side].frame,
          "fist",
        ).point;
        const across: number = Math.hypot(
          wrist.x - shoulder.x,
          wrist.z - shoulder.z,
        );
        if (across < short)
          sink = Math.max(
            sink,
            shoulder.y - wrist.y - Math.sqrt(short * short - across * across),
          );
      }
    }
    const taking: IHumanPosture = leaned(base.posture(SETTLE), 1);
    const arrived = chest(taking);
    const facing: number = heading(arrived.worldRotation);
    // Where the arms take the handles when the grips close: each fist on its
    // handle as nearly as the arm's range turns it there. That wrist and
    // that turn are what the push keeps, so the hands never ask a turn the
    // arms gave up, and the load riding one hand stays where the other holds
    // it.
    // Of the turns about its handle the handle's symmetry makes the same
    // grasp (`IAutoMovieAffordance.symmetry`: the whole way round a round
    // bar, half a turn a flat one, none else), the one whose fist comes
    // nearest its handle as the arm takes it, the authored side first.
    const take = (
      side: HumanHand.Side,
    ): { asked: HumanHand.IWrist; got: HumanHand.IWrist; off: number } => {
      const { frame: at, symmetry } = grips[side];
      const turns: readonly number[] =
        symmetry === "round" ? AROUND : symmetry === "half" ? [0, 180] : [0];
      let best:
        | { asked: HumanHand.IWrist; got: HumanHand.IWrist; off: number }
        | undefined;
      for (const degrees of turns) {
        const asked: HumanHand.IWrist = HumanHand.reach(
          body,
          side,
          "grip",
          {
            ...at,
            normal: Quaternion.rotateVector(
              Quaternion.fromAxisAngle(at.forward, degrees),
              at.normal,
            ),
          },
          "fist",
        );
        const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(
            body,
            resolveHumanPosture(body, {
              ...taking,
              limbs: {
                ...taking.limbs,
                [`${side}Arm`]: {
                  point: asked.point,
                  rotation: asked.rotation,
                  contact: sockets[side],
                  bend: elbow(taking, side),
                },
              },
            }),
          );
        const off: number = Vector3.length(
          Vector3.subtract(
            HumanHand.frame(body, bones, side, "grip", "fist").point,
            at.point,
          ),
        );
        const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        if (best === undefined || off < best.off - 1e-6)
          best = {
            asked,
            got: { point: hand.worldPosition, rotation: hand.worldRotation },
            off,
          };
      }
      return best!;
    };
    const taken: Record<HumanHand.Side, ReturnType<typeof take>> = {
      left: take("left"),
      right: take("right"),
    };
    const wrists: Record<HumanHand.Side, HumanHand.IWrist> = {
      left: taken.left.asked,
      right: taken.right.asked,
    };
    // A handle the fist does not reach when the grip closes would be held
    // in the air: the push is refused, the body to stand nearer.
    for (const side of ["left", "right"] as const) {
      const off: number = taken[side].off;
      if (!(off <= REACH))
        throw new HumanRefusal({
          kind: "reach",
          axis: "sled",
          value: off,
          feasible: { kind: "range", minimum: 0, maximum: REACH, unit: "m" },
          reason: `the ${side} fist stops ${(off * 1000).toFixed(0)} mm short of its handle as the grip closes, the arms leaning in at full reach`,
          fix: "stand nearer the sled before pushing it, or push one whose handles are within the arms' reach",
        });
    }
    const kept: Record<HumanHand.Side, HumanHand.IWrist> = {
      left: taken.left.got,
      right: taken.right.got,
    };
    const held: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: Vector3.subtract(kept.left.point, arrived.worldPosition),
      right: Vector3.subtract(kept.right.point, arrived.worldPosition),
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
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          t < SETTLE ? 0 : heading(c.worldRotation) - facing,
        );
        for (const side of sides) {
          // Carried along the floor at the handle's own height: the load
          // stays on the floor, the arms take the walk's rise and fall.
          const carried: IAutoMovieVector3 = Vector3.add(
            c.worldPosition,
            Quaternion.rotateVector(turn, held[side]),
          );
          const point: IAutoMovieVector3 =
            t < SETTLE
              ? wrists[side].point
              : { x: carried.x, y: kept[side].point.y, z: carried.z };
          // The fist's turn on its handle, turned only with the load's
          // heading so the gripped load does not tilt with the arms; where
          // the arm cannot meet it, the grip socket stays on the handle and
          // the turn gives.
          limbs[`${side}Arm`] = {
            point,
            rotation: Quaternion.normalize(
              Quaternion.multiply(
                turn,
                (t < SETTLE ? wrists : kept)[side].rotation,
              ),
            ),
            contact: sockets[side],
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
