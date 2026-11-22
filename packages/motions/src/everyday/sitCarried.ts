import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { carryHumanPosture } from "../posture/carryHumanPosture";

/**
 * A sit onto the seat of a prop that may move, carried by that prop: the
 * seat is read where its carrier stands when the sit begins, so the plan is
 * made in the carrier's frame at that instant, and every posture of it is
 * carried rigidly by the carrier's motion since (`carryHumanPosture`). The
 * seat and every foot the sit plants bear on the carrier, so the audits
 * read them in its frame. A ride that follows takes its origin where the
 * carrier then stands, on the seat the sit tracked. A seat in the world, or
 * a carrier that does not move during the sit, leaves the plan as it was.
 *
 * @param context The sit's context: its start and the props.
 * @param seat The seat, read where its carrier stands at the sit's start.
 * @param plan The sit's plan against that seat.
 * @returns The plan carried by the seat's carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the seat is read, what is carried, what bears on the carrier and the cases left as they were.
 * @evidence contracts/development/implementation.md#principled-implementation A goal fixed in a moving support's frame is that frame's motion applied to the goal planned at its start: `now * start^-1` on every world point and rotation of the posture, the carry a ride already applies to a seated rider.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrapper over the plan's posture and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carrier is the seat's own declared prop; nothing is searched for or guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One carrier frame and one rigid carry a read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `carryHumanPosture`, the one rigid carry of a posture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan, the carrier's reader and its starting frame for the plan's life.
 */
export function sitCarried(
  context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  if (seat.carrier === undefined) return plan;
  const subject: string = seat.carrier;
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const origin: IAutoMovieRigidTransform = read.frame(context.start);
  const carried = (
    contact: IAutoMovieMotionHumanContactWindow,
  ): IAutoMovieMotionHumanContactWindow =>
    contact.part === "seat" ||
    contact.part === "leftFoot" ||
    contact.part === "rightFoot"
      ? { ...contact, support: { kind: "prop", subject } }
      : contact;
  return {
    ...plan,
    contacts: plan.contacts.map(carried),
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      carryHumanPosture(
        plan.posture(seconds, channels, resolution, projection),
        origin,
        read.frame(
          context.start + Math.min(plan.duration, Math.max(0, seconds)),
        ),
      ),
  };
}
