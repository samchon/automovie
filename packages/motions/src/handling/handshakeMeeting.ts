import {
  type IAutoMovieResolvedBone,
  Vector3,
  minimumJerk,
  type resolveAutoMovieMutualGoal,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanSeatedReach } from "../touch/HumanSeatedReach";
import { HumanPrehension } from "./HumanPrehension";
import { handshakeOffer } from "./handshakeOffer";

/**
 * The meeting of a handshake (`AutoMovieMotionMeeting`): one record for both
 * partners, the single owner of where the two palms meet, of the line the
 * first partner's fingers point along, and of each partner's seat. The
 * point is `handshakeOffer.point` between the two acting shoulders; a seated
 * pair whose arms alone cannot meet leans its trunks forward over the seat
 * by the least common share of each one's room that lets them
 * (`HumanSeatedReach.goal`, Chan and Dubey 1995), and a pair even the full
 * lean cannot bring together is refused with the offer's own refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record owns, how the point is placed, the seated lean with its source and the refusal.
 * @evidence contracts/development/design.md#principled-representation A meeting kind: roles, two named contacts (the point and a point along the first partner's fingers) and the roles' timing, the shared record every mutual action reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The role's name, the kind, one partner's reading of it and the leaned base.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither partner computes the point on its own; both read the one record.
 */
export namespace handshakeMeeting {
  /** The role both partners take. */
  export const ROLE: string = "shaker";

  /**
   * The meeting kind of a handshake.
   *
   * @param props The shaking hand, the pump's amplitude, the shake's seconds and the acting arm of a partner for the mutual goal.
   * @returns The kind: contacts `meet` (the palms' point) and `along` (that point plus the first ordered partner's finger direction, a unit vector).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and both contacts.
   * @evidence contracts/development/implementation.md#principled-implementation The point and the finger line are the offer's from both acting shoulders, leaned only when the arms alone fall short; each role's timing is its own reach-to-grasp time over the comfortable reach, then the shake, so the meeting takes the slower reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Name, roles, defaults, the placement and the timing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pair the full lean cannot bring together throws the offer's refusal, never a stretched arm.
   * @evidence contracts/development/implementation.md#efficient-algorithms One offer per bisection step of the lean, and none past the first for a standing pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `handshakeOffer.point`, `HumanSeatedReach.goal` and `HumanPrehension.nominal`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The kind closes over its props only.
   */
  export function kind(props: {
    side: HumanHand.Side;
    pump: number;
    shake: number;
    arm: (
      body: IHumanBody,
      shoulder: IAutoMovieVector3,
    ) => resolveAutoMovieMutualGoal.ISide;
  }): AutoMovieMotionMeeting.IKind {
    const shoulder = (role: AutoMovieMotionMeeting.IRole): IAutoMovieVector3 =>
      role.bones.get(`${props.side}UpperArm`)!.worldPosition;
    return {
      name: `handshake-${props.side}`,
      roles: [ROLE, ROLE],
      contacts: {
        meet: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        along: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      },
      place: (
        roles: readonly AutoMovieMotionMeeting.IRole[],
      ): Record<string, IAutoMovieVector3> => {
        const met: handshakeOffer.IMeeting = HumanSeatedReach.goal<
          handshakeOffer.ISide,
          handshakeOffer.IMeeting
        >(
          [roles[0]!, roles[1]!],
          [
            { body: roles[0]!.body, shoulder: shoulder(roles[0]!) },
            { body: roles[1]!.body, shoulder: shoulder(roles[1]!) },
          ],
          (
            a: handshakeOffer.ISide,
            b: handshakeOffer.ISide,
          ): handshakeOffer.IMeeting =>
            handshakeOffer.point(a, b, props.side, props.pump),
        );
        return { meet: met.point, along: Vector3.add(met.point, met.fingers) };
      },
      timing: (
        role: AutoMovieMotionMeeting.IRole,
      ): AutoMovieMotionMeeting.ITiming => {
        const reach: number = HumanPrehension.nominal(
          props.arm(role.body, shoulder(role)).reach,
          0,
        );
        return { ready: reach, stroke: reach, relax: reach + props.shake };
      },
    };
  }

  /**
   * What one partner reads of the meeting: the point with its own finger
   * line, and how far its trunk leans to reach the point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The offer's own meeting record and one angle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the handshake's plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The finger line is this partner's, already turned for its place in the meeting's order.
   */
  export interface IRead {
    /** The point and this partner's finger line, world. */
    meeting: handshakeOffer.IMeeting;

    /** The trunk's forward lean, a share of its seated joints' rooms (`HumanSeatedReach.need`); none standing. */
    lean: { share: number; joints: HumanSeatedReach.IJoint[] };
  }

  /**
   * One partner's reading of the shared meeting.
   *
   * @param context The partner's action context.
   * @param side The shaking hand.
   * @param phases The pump's amplitude, metres, and the shake's seconds.
   * @param arm The acting arm of a partner for the mutual goal.
   * @returns The point, this partner's finger line and its lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the reading.
   * @evidence contracts/development/implementation.md#principled-implementation The meeting is read through the context, so the first partner planned computes it and the other reads that record; the finger line is the first ordered partner's, turned for the second; the lean is this partner's least lean that brings the point within its arm, the target first (`HumanSeatedReach.need`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the meeting, two points back to the world, one lean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A standing partner leans none, so its plan is the standing one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One meeting per pair and one original bisection for a seated partner. Entry FK emits only the actual shoulder for standing, adding exactly the original seated spine/hip/chest/neck/left-thigh observations when a seat bears the role; every authored joint is still admitted.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The context's meeting reader, `HumanFrame.point` and `HumanSeatedReach.need`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure reading.
   */
  export function read(
    context: IHumanActionContext<{ partner: string }>,
    side: HumanHand.Side,
    phases: { pump: number; shake: number },
    arm: (
      body: IHumanBody,
      shoulder: IAutoMovieVector3,
    ) => resolveAutoMovieMutualGoal.ISide,
  ): IRead {
    const shared: AutoMovieMotionMeeting.IMeeting = context.meeting(
      kind({ side, pump: phases.pump, shake: phases.shake, arm }),
      ROLE,
      { role: ROLE, subject: context.params.partner },
    );
    const point: IAutoMovieVector3 = HumanFrame.point(
      shared.frame,
      shared.contacts.meet!,
    );
    const along: IAutoMovieVector3 = Vector3.subtract(
      HumanFrame.point(shared.frame, shared.contacts.along!),
      point,
    );
    const seated: boolean = context.entry.supports.some(
      (support: IHumanEntryState.ISupport): boolean => support.kind === "seat");
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`, ...(seated
        ? ["hips", "chest", "neck", "leftUpperLeg", "leftLowerLeg", ...HumanSeatedReach.SPINE] as const : []),
    ]);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
      undefined,
      requested,
    );
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    return {
      meeting: {
        point,
        fingers:
          shared.roles[0]?.subject === context.subject
            ? along
            : Vector3.scale(along, -1),
      },
      lean: HumanSeatedReach.need(
        {
          name: ROLE,
          subject: context.subject,
          body: context.body,
          posture: context.entry.posture,
          bones,
          seated,
        },
        shoulder,
        point,
        arm(context.body, shoulder).limit,
      ),
    };
  }

  /**
   * A handshake's base with the trunk leaned over the seat: in over the
   * reach, held through the pump, out over the return.
   *
   * @param body The body.
   * @param base The standing base.
   * @param lean The share of the seated joints' rooms at the clasp, and those joints.
   * @param phases The reach's, the shake's and the return's seconds.
   * @returns The base, unchanged when the lean is none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the course of the lean and the case with none.
   * @evidence contracts/development/implementation.md#principled-implementation The lean follows the hand's own minimum-jerk course in and out, written on the trunk's joints over the seat (`HumanSeatedReach.posed`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weight per second, one leaned posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No lean returns the very base, so a standing handshake is the standing one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanSeatedReach.posed` and `minimumJerk`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base, the joints and four numbers.
   */
  export function leaned(
    body: IHumanBody,
    base: IHumanActionPlan,
    lean: IRead["lean"],
    phases: { reach: number; shake: number; back: number },
  ): IHumanActionPlan {
    if (lean.share === 0) return base;
    const { reach, shake, back } = phases;
    return {
      ...base,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(reach + shake + back, Math.max(0, seconds));
        const w: number =
          t < reach
            ? minimumJerk.share(t / reach)
            : t <= reach + shake
              ? 1
              : Math.max(0, 1 - minimumJerk.share((t - reach - shake) / back));
        return HumanSeatedReach.posed(
          body,
          base.posture(seconds),
          lean.joints,
          lean.share * w,
        );
      },
    };
  }
}
