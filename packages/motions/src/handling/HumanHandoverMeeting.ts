import {
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieMutualGoal,
} from "@automovie/engine";
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

/**
 * The meeting of a handover (`AutoMovieMotionMeeting`): one record for the
 * giver and the receiver, the single owner of where the object's receiving
 * grip is handed over and of each partner's seat. The place is the mutual
 * goal of both acting shoulders (`resolveAutoMovieMutualGoal` with the
 * handshake's comfortable reach) at the exchange height
 * (`HumanHandover.EXCHANGE`); a seated pair whose arms alone cannot meet
 * leans its trunks forward over the seat by the least common share of each
 * one's room that lets them (`HumanSeatedReach.goal`, Chan and Dubey 1995),
 * and a pair even the full lean cannot bring together is refused with the
 * mutual goal's own error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record owns, how the place is found, the seated lean with its source and the refusal.
 * @evidence contracts/development/design.md#principled-representation A meeting kind with the roles `giver` and `receiver`, one contact and the roles' timing, the shared record every mutual action reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The role names, the mutual goal's inputs and the kind.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither partner computes the place on its own; both read the one record.
 */
export namespace HumanHandoverMeeting {
  /** The giver's role. */
  export const GIVER: string = "giver";

  /** The receiver's role. */
  export const RECEIVER: string = "receiver";

  /**
   * The mutual goal's inputs of a handover: the height the receiving grip
   * lands at and both acting arms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The engine's mutual goal input, named.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by `resolveAutoMovieMutualGoal`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The arms are the handshake's, never a second reach model.
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
   * @param exchange The object's middle's height as a share of the partners' mean sternum height (`HumanHandover.EXCHANGE`).
   * @returns The height and both arms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The object's middle at the exchange share of the partners' mean sternum height (Khanna, Bjorkman and Smith 2023), the grip's height then that middle less the grip's offset from it; the arms are the handshake's comfortable reach from each acting shoulder.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two sternum heights, the prop's span, two arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: every value is read on the bodies and the prop.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanGrasp.at`, `HumanGrasp.span` and `handshake.arm`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function goal(
    input: Pick<
      IAutoMovieMotionHumanHandover.IInput,
      "giver" | "receiver" | "prop" | "frame" | "handle"
    >,
    exchange: number,
  ): IGoal {
    const atStart: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.at(
      input.prop,
      input.handle,
      input.frame,
    );
    const sternum: (person: IAutoMovieMotionHumanHandover.IPerson) => number = (person: IAutoMovieMotionHumanHandover.IPerson): number =>
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
   * @param props Each partner's acting hand, the prop with its frame at the start and the receiving grip, and the exchange share.
   * @returns The kind: the contact `meet`, where the receiving grip is handed over.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the contact.
   * @evidence contracts/development/implementation.md#principled-implementation The place is the mutual goal of `goal`, leaned only when a seated pair's arms alone fall short; each role's timing is its comfortable reach's reach-to-grasp time, so the record is kept for the partner planned second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Name, roles, the default, the placement and the timing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pair the full lean cannot bring together throws the mutual goal's error; the handover's own timing stays `HumanHandover.plan`'s.
   * @evidence contracts/development/implementation.md#efficient-algorithms One mutual goal per bisection step of the lean, and one for a standing pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `goal`, `HumanSeatedReach.goal` and `HumanPrehension.nominal`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The kind closes over its props only.
   */
  export function kind(props: {
    giver: AutoMovieHumanSide;
    receiver: AutoMovieHumanSide;
    prop: IAutoMovieMotionHumanProp;
    frame: IAutoMovieRigidTransform;
    handle: string;
    exchange: number;
  }): IAutoMovieMotionMeetingKind {
    const person: (role: IAutoMovieMotionMeetingRole) => IAutoMovieMotionHumanHandover.IPerson = (
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
              resolveAutoMovieMutualGoal({ height: inputs.height, a, b }).point,
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
