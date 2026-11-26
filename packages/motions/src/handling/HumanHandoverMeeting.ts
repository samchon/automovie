import { resolveAutoMovieHumanoidSurfaces, AutoMovieEngineCompositionPose } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHandover,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionMeetingTiming,
  IAutoMovieResolveMutualGoal,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanSeatedReach } from "../touch/HumanSeatedReach";
import { HumanGrasp } from "./HumanGrasp";
import { HumanPrehension } from "./HumanPrehension";
import { handshake } from "./handshake";

/** The record of `IKindProps`'s site. */
type IKindProps = {
  giver: AutoMovieHumanSide;
  receiver: AutoMovieHumanSide;
  prop: IAutoMovieMotionHumanProp;
  frame: IAutoMovieRigidTransform;
  handle: string;
  exchange: number;
};

/** The alternatives of `GoalInput`'s site. */
type GoalInput = "giver" | "receiver" | "prop" | "frame" | "handle";

/**
 * The meeting of a handover (`AutoMovieMotionMeeting`): one record for the
 * giver and the receiver, the single owner of where the object's receiving grip
 * is handed over and of each partner's seat. The place is the mutual goal of
 * both acting shoulders (`resolveAutoMovieMutualGoal` with the handshake's
 * comfortable reach) at the exchange height (`HumanHandover.EXCHANGE`); a
 * seated pair whose arms alone cannot meet leans its trunks forward over the
 * seat by the least common share of each one's room that lets them
 * (`HumanSeatedReach.goal`, Chan and Dubey 1995), and a pair even the full lean
 * cannot bring together is refused with the mutual goal's own error.
 */
export namespace HumanHandoverMeeting {
  /** The giver's role. */
  export const GIVER: string = "giver";

  /** The receiver's role. */
  export const RECEIVER: string = "receiver";

  /**
   * The mutual goal's inputs of a handover: the height the receiving grip lands
   * at and both acting arms.
   */
  export interface IGoal {
    /** The receiving grip's height, world metres. */
    height: number;

    /** The giver's acting arm. */
    a: IAutoMovieResolveMutualGoal.ISide;

    /** The receiver's acting arm. */
    b: IAutoMovieResolveMutualGoal.ISide;
  }

  /**
   * The mutual goal's inputs from both partners as they stand.
   *
   * @param input Both partners, the prop, its frame and the receiving grip.
   * @param exchange The object's middle's height as a share of the partners'
   *   mean sternum height (`HumanHandover.EXCHANGE`).
   * @returns The height and both arms.
   */
  export function goal(
    input: Pick<IAutoMovieMotionHumanHandover.IInput, GoalInput>,
    exchange: number,
  ): IGoal {
    const atStart: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.at(
      input.prop,
      input.handle,
      input.frame,
    );
    const sternum: (person: IAutoMovieMotionHumanHandover.IPerson) => number = (
      person: IAutoMovieMotionHumanHandover.IPerson,
    ): number =>
      resolveAutoMovieHumanoidSurfaces.place(
        person.body.surfaces.regions.sternum,
        person.bones.get(person.body.surfaces.regions.sternum.bone)!,
      ).point.y;
    const [bottom, top]: readonly [number, number] = HumanGrasp.span(
      atStart.colliders,
      { x: 0, y: 1, z: 0 },
    );
    return {
      height:
        (exchange * (sternum(input.giver) + sternum(input.receiver))) / 2 -
        ((bottom + top) / 2 - atStart.point.y),
      a: handshake.arm(
        input.giver.body,
        input.giver.side,
        input.giver.bones.get(`${input.giver.side}UpperArm`)!.worldPosition,
      ),
      b: handshake.arm(
        input.receiver.body,
        input.receiver.side,
        input.receiver.bones.get(`${input.receiver.side}UpperArm`)!
          .worldPosition,
      ),
    };
  }

  /**
   * The meeting kind of a handover.
   *
   * @param props Each partner's acting hand, the prop with its frame at the
   *   start and the receiving grip, and the exchange share.
   * @returns The kind: the contact `meet`, where the receiving grip is handed
   *   over.
   */
  export function kind(props: IKindProps): IAutoMovieMotionMeetingKind {
    const person: (
      role: IAutoMovieMotionMeetingRole,
    ) => IAutoMovieMotionHumanHandover.IPerson = (
      role: IAutoMovieMotionMeetingRole,
    ): IAutoMovieMotionHumanHandover.IPerson => ({
      body: role.body,
      side: role.name === GIVER ? props.giver : props.receiver,
      bones: role.bones,
    });
    return {
      name: "handover",
      roles: [GIVER, RECEIVER],
      contacts: { meet: AutoMovieMotionHumanTarget.DEFAULTS.ahead },
      place: (
        roles: readonly IAutoMovieMotionMeetingRole[],
      ): Record<string, IAutoMovieVector3> => {
        const giver: IAutoMovieMotionMeetingRole = roles.find(
          (r: IAutoMovieMotionMeetingRole): boolean => r.name === GIVER,
        )!;
        const receiver: IAutoMovieMotionMeetingRole = roles.find(
          (r: IAutoMovieMotionMeetingRole): boolean => r.name === RECEIVER,
        )!;
        const inputs: IGoal = goal(
          {
            giver: person(giver),
            receiver: person(receiver),
            prop: props.prop,
            frame: props.frame,
            handle: props.handle,
          },
          props.exchange,
        );
        return {
          meet: HumanSeatedReach.goal(
            [giver, receiver],
            [inputs.a, inputs.b],
            (
              a: IAutoMovieResolveMutualGoal.ISide,
              b: IAutoMovieResolveMutualGoal.ISide,
            ): IAutoMovieVector3 =>
              AutoMovieEngineCompositionPose.mutualGoal({ height: inputs.height, a, b }).point,
          ),
        };
      },
      timing: (
        role: IAutoMovieMotionMeetingRole,
      ): IAutoMovieMotionMeetingTiming => {
        const side: AutoMovieHumanSide =
          role.name === GIVER ? props.giver : props.receiver;
        const reach: number = HumanPrehension.nominal(
          handshake.arm(
            role.body,
            side,
            role.bones.get(`${side}UpperArm`)!.worldPosition,
          ).reach,
          0,
        );
        return { ready: reach, stroke: reach, relax: reach };
      },
    };
  }
}
