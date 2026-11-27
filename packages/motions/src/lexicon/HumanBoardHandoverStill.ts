import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { HumanAuditModel } from "../posture/HumanAuditModel";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/internal/poseBones";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";
import type { HumanBoardHandover } from "./HumanBoardHandover";
import { HumanUnseatPose } from "./HumanUnseatPose";

/**
 * Whether a boarding holds a set of hands on a partner at a second: the holds
 * as the plan's posture writes a hand on the partner (the hand reached to its
 * point on the boarding, the partner's body as the audit's one model segments
 * it the rests the arm keeps clear of), admitted by the arm course's own still
 * problem there (`AutoMovieMotionHumanArmPlanned.stands`) once the boarding's
 * own arm fit lays every hand on its point.
 *
 * @param context The boarding's context.
 * @param hand The holding hand, on a partner.
 * @param boarding The boarding body without its holding hand, by local second.
 * @returns The test the hand-over planner asks of its holds.
 */
export function HumanBoardHandoverStill(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBoard>,
  hand: IAutoMovieMotionHumanBoard.IHand,
  boarding: (time: number) => IAutoMovieMotionHumanPosture,
): (t: number, holds: readonly HumanBoardHandover.IHold[]) => boolean {
  return (t: number, holds: readonly HumanBoardHandover.IHold[]): boolean => {
    // A hand the boarding's own arm fit cannot lay on its point is
    // not held there by any course, so the still problem, which
    // fails slowly through all its starts, is not asked (a necessary
    // condition tested first, as the planner tests its hold before
    // its trajectory).
    const fitted: ReturnType<typeof poseBones> = poseBones(
      context.body,
      resolveHumanPosture(
        context.body,
        holds.reduce(
          (
            posture: IAutoMovieMotionHumanPosture,
            held: HumanBoardHandover.IHold,
          ): IAutoMovieMotionHumanPosture =>
            HumanUnseatPose.reach(posture, held.side, held.point, 1),
          boarding(t),
        ),
      ),
      undefined,
      new Set<AutoMovieHumanoidBone>(
        holds.map(
          (held: HumanBoardHandover.IHold): AutoMovieHumanoidBone =>
            `${held.side}Hand`,
        ),
      ),
    );
    if (
      holds.some(
        (held: HumanBoardHandover.IHold): boolean =>
          Vector3.distance(
            fitted.get(`${held.side}Hand`)!.worldPosition,
            held.point,
          ) > AutoMovieMotionHumanAuditTangle.BUILT,
      )
    )
      return false;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      hand.partner!,
    );
    const resting: ReturnType<ReturnType<typeof HumanColliders.preparePlaced>> =
      HumanColliders.preparePlaced(
        other.body,
        HumanAuditModel.segments(other.body),
      )(other.bones(context.start + t, HumanAuditModel.segments(other.body)));
    return AutoMovieMotionHumanArmPlanned.stands(
      context.body,
      {
        seconds: t,
        carries: holds.map(
          (
            held: HumanBoardHandover.IHold,
          ): IAutoMovieMotionHumanArmPlanned.IPlanned => ({
            side: held.side,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, held.side),
            weight: (): number => 1,
            goal: (
              _posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieHumanLimbGoal => ({
              ...HumanUnseatPose.reach(
                boarding(seconds),
                held.side,
                held.point,
                1,
              ).limbs[`${held.side}Arm`]!,
              rests: resting,
            }),
          }),
        ),
      },
      (seconds: number): IAutoMovieMotionHumanPosture => boarding(seconds),
    );
  };
}
