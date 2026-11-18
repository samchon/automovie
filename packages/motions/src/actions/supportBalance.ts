import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import { prepareBearingTrunkBalance } from "../everyday/prepareBearingTrunkBalance";
import { HumanPhysics } from "../law/HumanPhysics";
import { prepareSupportCorrection } from "./prepareSupportCorrection";

/** Apply the authored clock of a support action or its composition after the constraint keys fix their times. */
export function supportBalance<P extends HumanPhysics.IBalanced>(
  context: IAutoMovieMotionHumanActionContext<P>,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const window: HumanPhysics.Window = HumanPhysics.prepare(context.params, {}, context.start, plan, context.instant);
  if (window === null) return { ...plan, ...HumanPhysics.declared(context.params, null) };
  // Lumbar rotation preserves lower-body contacts directly. A pinned arm or
  // pelvis instead requires the constrained fit on that sample's actual anchors.
  const pinned: boolean = plan.contacts.some((contact) =>
    upper(contact) && HumanPhysics.intersects(window, plan.duration * contact.from, plan.duration * contact.to));
  const adjust: ReturnType<typeof prepareBearingTrunkBalance> = window.by === "trunk" && !pinned
    ? prepareBearingTrunkBalance(context.body, window, plan.duration, plan.contacts)
    : prepareSupportCorrection(context.body, window, plan);
  return {
    ...plan,
    ...HumanPhysics.declared(context.params, window),
    posture: (seconds, channels, resolution, projection) => adjust(
      plan.posture(seconds, channels, resolution, projection), seconds, undefined, resolution, projection),
  };
}

/** Contacts carried on the lumbar subtree by the whole-body key fit. */
function upper(contact: IAutoMovieMotionHumanContactWindow): boolean {
  return contact.part === "back" || contact.part.endsWith("Arm") || contact.part.endsWith("Hand");
}
