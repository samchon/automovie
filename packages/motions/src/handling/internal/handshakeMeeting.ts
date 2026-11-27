import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionMeetingTiming,
  IAutoMovieResolveMutualGoal,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSeatedReach } from "../../touch/HumanSeatedReach";
import { HumanPrehension } from "../HumanPrehension";
import { handshakeOffer } from "./handshakeOffer";

/** The record of `ILeanedPhases`'s site. */
type ILeanedPhases = { reach: number; shake: number; back: number };

/** The record of `IReadPhases`'s site. */
type IReadPhases = { pump: number; shake: number };

/** The record of `IReadContext`'s site. */
type IReadContext = { partner: string };

/** The record of `IReadLean`'s site. */
type IReadLean = {
  share: number;
  joints: IAutoMovieMotionHumanSeatedReach.IJoint[];
};

/** The record of `IKindProps`'s site. */
type IKindProps = {
  side: AutoMovieHumanSide;
  pump: number;
  shake: number;
  arm: (
    body: IAutoMovieMotionHumanBody,
    shoulder: IAutoMovieVector3,
  ) => IAutoMovieResolveMutualGoal.ISide;
};

/**
 * The meeting of a handshake (`AutoMovieMotionMeeting`): one record for both
 * partners, the single owner of where the two palms meet, of the line the first
 * partner's fingers point along, and of each partner's seat. The point is
 * `handshakeOffer.point` between the two acting shoulders; a seated pair whose
 * arms alone cannot meet leans its trunks forward over the seat by the least
 * common share of each one's room that lets them (`HumanSeatedReach.goal`, Chan
 * and Dubey 1995), and a pair even the full lean cannot bring together is
 * refused with the offer's own refusal.
 */
export namespace handshakeMeeting {
  /** The role both partners take. */
  export const ROLE: string = "shaker";

  /**
   * The meeting kind of a handshake.
   *
   * @param props The shaking hand, the pump's amplitude, the shake's seconds
   *   and the acting arm of a partner for the mutual goal.
   * @returns The kind: contacts `meet` (the palms' point) and `along` (that
   *   point plus the first ordered partner's finger direction, a unit vector).
   */
  export function kind(props: IKindProps): IAutoMovieMotionMeetingKind {
    const shoulder = (role: IAutoMovieMotionMeetingRole): IAutoMovieVector3 =>
      role.bones.get(`${props.side}UpperArm`)!.worldPosition;
    return {
      name: `handshake-${props.side}`,
      roles: [ROLE, ROLE],
      contacts: {
        meet: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        along: AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      },
      place: (
        roles: readonly IAutoMovieMotionMeetingRole[],
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
        role: IAutoMovieMotionMeetingRole,
      ): IAutoMovieMotionMeetingTiming => {
        const reach: number = HumanPrehension.nominal(
          props.arm(role.body, shoulder(role)).reach,
          0,
        );
        return { ready: reach, stroke: reach, relax: reach + props.shake };
      },
    };
  }

  /**
   * What one partner reads of the meeting: the point with its own finger line,
   * and how far its trunk leans to reach the point.
   */
  export interface IRead {
    /** The point and this partner's finger line, world. */
    meeting: handshakeOffer.IMeeting;

    /**
     * The trunk's forward lean, a share of its seated joints' rooms
     * (`HumanSeatedReach.need`); none standing.
     */
    lean: IReadLean;
  }

  /**
   * One partner's reading of the shared meeting.
   *
   * @param context The partner's action context.
   * @param side The shaking hand.
   * @param phases The pump's amplitude, metres, and the shake's seconds.
   * @param arm The acting arm of a partner for the mutual goal.
   * @returns The point, this partner's finger line and its lean.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext<IReadContext>,
    side: AutoMovieHumanSide,
    phases: IReadPhases,
    arm: (
      body: IAutoMovieMotionHumanBody,
      shoulder: IAutoMovieVector3,
    ) => IAutoMovieResolveMutualGoal.ISide,
  ): IRead {
    const shared: IAutoMovieMotionMeeting = context.meeting(
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
      (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        support.kind === "seat",
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        `${side}UpperArm`,
        ...(seated
          ? ([
              "hips",
              "chest",
              "neck",
              "leftUpperLeg",
              "leftLowerLeg",
              ...HumanSeatedReach.SPINE,
            ] as const)
          : []),
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
   * A handshake's base with the trunk leaned over the seat: in over the reach,
   * held through the pump, out over the return.
   *
   * @param body The body.
   * @param base The standing base.
   * @param lean The share of the seated joints' rooms at the clasp, and those
   *   joints.
   * @param phases The reach's, the shake's and the return's seconds.
   * @returns The base, unchanged when the lean is none.
   */
  export function leaned(
    body: IAutoMovieMotionHumanBody,
    base: IAutoMovieMotionHumanActionPlan,
    lean: IRead["lean"],
    phases: ILeanedPhases,
  ): IAutoMovieMotionHumanActionPlan {
    if (lean.share === 0) return base;
    const { reach, shake, back } = phases;
    return {
      ...base,
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(reach + shake + back, Math.max(0, seconds));
        const w: number =
          t < reach
            ? AutoMovieEngineMotionSampling.minimumJerkShare(t / reach)
            : t <= reach + shake
              ? 1
              : Math.max(0, 1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - reach - shake) / back));
        return HumanSeatedReach.posed(
          body,
          base.posture(seconds, undefined, resolution, projection),
          lean.joints,
          lean.share * w,
        );
      },
    };
  }
}
