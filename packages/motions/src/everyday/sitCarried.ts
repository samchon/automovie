import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { carryHumanPosture } from "../posture/carryHumanPosture";

/** The alternatives of `SitCarriedContext`'s site. */
type SitCarriedContext = "prop" | "start";

/**
 * A sit onto the seat of a prop that may move, carried by that prop: the seat
 * is read where its carrier stands when the sit begins, so the plan is made in
 * the carrier's frame at that instant, and every posture of it is carried
 * rigidly by the carrier's motion since (`carryHumanPosture`). A seat that
 * names its own contact on the carrier (`ISeat.point`) is also followed as that
 * contact moves within the carrier, a saddle rising and falling on a walking
 * horse's back: the root moves by the contact's stray from where the carrier
 * alone would have taken it, as a ride's does, so a ride that begins while the
 * horse walks takes over a rider on the seat. The seat and every foot the sit
 * plants bear on the carrier, so the audits read them in its frame, unless the
 * plan already declares which of its windows bear on the carrier, as getting
 * onto a saddle from the floor does: its floor plants stay on the floor. A ride
 * that follows takes its origin where the carrier then stands, on the seat the
 * sit tracked. A seat in the world, or a carrier that does not move during the
 * sit, leaves the plan as it was.
 *
 * @param context The sit's context: its start and the props.
 * @param seat The seat, read where its carrier stands at the sit's start.
 * @param plan The sit's plan against that seat.
 * @param declared Whether the plan's windows already name the carrier where
 *   they bear on it; when absent or false, the seat and every foot window are
 *   put on it.
 * @returns The plan carried by the seat's carrier.
 */
export function sitCarried(
  context: Pick<IAutoMovieMotionHumanActionContext, SitCarriedContext>,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  plan: IAutoMovieMotionHumanActionPlan,
  declared: boolean = false,
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
  // The seat's own contact where the sit begins, when the seat names it: the sit follows it as it moves within the carrier.
  const began: IAutoMovieVector3 | undefined =
    seat.point === undefined
      ? undefined
      : read.prop.point?.(seat.point, context.start)?.point;
  const turned: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
  return {
    ...plan,
    contacts: declared ? plan.contacts : plan.contacts.map(carried),
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const film: number =
        context.start + Math.min(plan.duration, Math.max(0, seconds));
      const now: IAutoMovieRigidTransform = read.frame(film);
      const posture: IAutoMovieMotionHumanPosture = carryHumanPosture(
        plan.posture(seconds, channels, resolution, projection),
        origin,
        now,
      );
      const moved: IAutoMovieVector3 | undefined =
        began === undefined
          ? undefined
          : read.prop.point?.(seat.point!, film)?.point;
      if (began === undefined || moved === undefined) return posture;
      // How far the seat has left the place the carrier alone would have carried it to, the stray a ride adds to its root (`HumanRide`).
      const stray: IAutoMovieVector3 = Vector3.subtract(
        moved,
        Vector3.add(
          now.position,
          Quaternion.rotateVector(
            Quaternion.multiply(now.rotation, turned),
            Vector3.subtract(began, origin.position),
          ),
        ),
      );
      return { ...posture, root: Vector3.add(posture.root, stray) };
    },
  };
}
