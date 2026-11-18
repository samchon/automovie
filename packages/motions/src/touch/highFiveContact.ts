import { Vector3, resolveAutoMovieMutualGoal } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingRole,
  IAutoMovieResolveMutualGoal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTargetGrid } from "../compose/AutoMovieMotionHumanTargetGrid";
import { handshake } from "../handling/handshake";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSeatedReach } from "./HumanSeatedReach";
import { HumanPerception } from "../law/HumanPerception";
import { HumanColliders } from "../posture/HumanColliders";

/**
 * The two opposed hand frames of a high five. Both hands approach one
 * contact plane with a common upright axis. For a fixed hand attitude the
 * wrist is a translation of the meeting point, so its reach sphere can be
 * written in meeting-point coordinates before the two spheres intersect.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared plane, the orientation and the change of coordinates.
 * @evidence contracts/development/design.md#principled-representation A single horizontal normal and the body's existing contact frame determine the virtual reach sphere for each hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the hand form, the opposed normal and the translated reach serve the high-five law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the real contact offset and limb lengths; no wider reach or contact allowance is introduced.
 */
export namespace highFiveContact {
  /** Place a shared hand contact inside both performers' reachable spheres. */
  export function place(
    roles: readonly IAutoMovieMotionMeetingRole[],
    kind: IAutoMovieMotionHumanHighFive.Kind,
    side: AutoMovieHumanSide,
    bare: boolean,
    height: IAutoMovieMotionHumanTargetGrid.Height,
  ): Record<string, IAutoMovieVector3> {
    const delta: IAutoMovieVector3 = Vector3.subtract(
      roles[1]!.posture.root,
      roles[0]!.posture.root,
    );
    const horizontal: IAutoMovieVector3 = { ...delta, y: 0 };
    const axis: IAutoMovieVector3 = Vector3.normalize(horizontal);
    const shifts: IAutoMovieVector3[] = [];
    const hand: IAutoMovieMotionHumanTouchEffector.IEffector =
      highFiveContact.hand(kind);
    const tangent: IAutoMovieMotionHumanTouchForm.Tangent = highFiveContact.tangent(kind);
    const arms: IAutoMovieResolveMutualGoal.ISide[] = roles.map(
      (
        r: IAutoMovieMotionMeetingRole,
        i: number,
      ): IAutoMovieResolveMutualGoal.ISide => {
        const shoulder: IAutoMovieVector3 = r.bones.get(
          `${side}UpperArm`,
        )!.worldPosition;
        if (!bare) return handshake.arm(r.body, side, shoulder);
        const virtual: IAutoMovieResolveMutualGoal.ISide =
          highFiveContact.arm(
            r,
            side,
            hand,
            tangent,
            {
              point: shoulder,
              normal: highFiveContact.opposed(kind, axis, i === 0),
              solid: true,
            },
            shoulder,
          );
        shifts.push(Vector3.subtract(virtual.shoulder, shoulder));
        return { ...virtual, shoulder };
      },
    );
    // The grid's height is a standing body's; a seated body's is that
    // height lowered by as much as its acting shoulder, leaned as the
    // reach leans it, sits below the standing body's.
    const preferred = (
      leaned: readonly IAutoMovieResolveMutualGoal.ISide[],
    ): number =>
      roles.reduce(
        (sum: number, r: IAutoMovieMotionMeetingRole, k: number): number =>
          sum +
          AutoMovieMotionHumanTargetGrid.height(r.body, height) *
            r.body.measure.stature -
          (r.seated === true
            ? r.body.rest.get(`${side}UpperArm`)!.y - leaned[k]!.shoulder.y
            : 0),
        0,
      ) / roles.length;
    // The engine refuses a pair no point lies within both arms of; its
    // message names the shoulder gap the pair can close.
    // A seated pair leans its trunks over the seat when the arms
    // alone fall short (`HumanSeatedReach`).
    try {
      return {
        meet: HumanSeatedReach.goal(
          [roles[0]!, roles[1]!],
          [arms[0]!, arms[1]!],
          (
            a: IAutoMovieResolveMutualGoal.ISide,
            b: IAutoMovieResolveMutualGoal.ISide,
          ): IAutoMovieVector3 =>
            resolveAutoMovieMutualGoal({
              a: translated(a, shifts[0]),
              b: translated(b, shifts[1]),
              height: preferred([a, b]),
            }).point,
          `${side}UpperArm`,
        ),
      };
    } catch (error: unknown) {
      const span: IAutoMovieVector3 = Vector3.subtract(
        arms[1]!.shoulder,
        arms[0]!.shoulder,
      );
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: Math.hypot(span.x, span.z),
        feasible: null,
        reason: error instanceof Error ? error.message : String(error),
        fix: "stand the partners within reach of each other",
      });
    }
  }

  /** The surface of the bare hand that meets the partner. */
  export function hand(
    kind: IAutoMovieMotionHumanHighFive.Kind,
  ): IAutoMovieMotionHumanTouchEffector.IEffector {
    return kind === "fist"
      ? { surface: "fist", shape: "fist" }
      : { surface: "palm", shape: "flat" };
  }

  /** The contact normal pointing toward the role, in world axes. */
  export function normal(
    meeting: IAutoMovieMotionMeeting,
    subject: string,
    kind: IAutoMovieMotionHumanHighFive.Kind,
  ): IAutoMovieVector3 {
    const yaw: number = (meeting.frame.yaw * Math.PI) / 180;
    return opposed(kind, { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) }, meeting.roles[0]!.subject === subject);
  }

  /** Flat low fives meet palm down to palm up; higher meetings use the shared vertical plane. */
  export function opposed(
    kind: IAutoMovieMotionHumanHighFive.Kind,
    forward: IAutoMovieVector3,
    first: boolean,
  ): IAutoMovieVector3 {
    const direction: number = first ? -1 : 1;
    return kind === "low" ? { x: 0, y: direction, z: 0 } : Vector3.scale(forward, direction);
  }

  /** At the waist the formed fingers lie along the horizontal plane. */
  export function tangent(kind: IAutoMovieMotionHumanHighFive.Kind): IAutoMovieMotionHumanTouchForm.Tangent {
    return kind === "low" ? "across" : "up";
  }

  /** A role's real wrist reach expressed as a sphere for the skin contact. */
  export function arm(
    role: IAutoMovieMotionMeetingRole,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
    placement: IAutoMovieMotionHumanTarget.IPlace,
    shoulder: IAutoMovieVector3,
  ): IAutoMovieResolveMutualGoal.ISide {
    const wrist: IAutoMovieVector3 = AutoMovieMotionHumanTouchLaid.rest(
      role.body,
      role.posture,
      side,
      effector,
      placement,
      tangent,
      shoulder,
    ).point;
    const limit: number =
      role.body.measure.upperArm + role.body.measure.forearm;
    return {
      shoulder: Vector3.add(shoulder, Vector3.subtract(placement.point, wrist)),
      reach: operate.REACH * limit,
      limit,
    };
  }

  /** The partner's displayed approach obstacles, omitting the arm that moves to the shared hand contact. */
  export function blocking(
    context: Pick<IAutoMovieMotionHumanActionContext, "performer" | "start">,
    partner: string,
    arm: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    const peer: IAutoMovieMotionHumanPerformerReader = context.performer(partner);
    const moving: RegExp = new RegExp(`^${arm}(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)`);
    const demand: Set<AutoMovieHumanoidBone> = new Set(
      [...HumanColliders.bones(peer.body)].filter((bone: AutoMovieHumanoidBone): boolean => !moving.test(bone)),
    );
    return HumanColliders.placed(peer.body, peer.bones(context.start - HumanPerception.REACTION, demand));
  }
}

/** Move an arm's reach sphere from wrist coordinates to shared contact coordinates. */
function translated(
  arm: IAutoMovieResolveMutualGoal.ISide,
  shift: IAutoMovieVector3 | undefined,
): IAutoMovieResolveMutualGoal.ISide {
  return shift === undefined
    ? arm
    : { ...arm, shoulder: Vector3.add(arm.shoulder, shift) };
}
