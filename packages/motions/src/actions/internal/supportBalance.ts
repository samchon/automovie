import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { prepareHumanPostureCorrection } from "../../compose/internal/prepareHumanPostureCorrection";
import { HumanBalance } from "../../everyday/internal/HumanBalance";
import { prepareBearingTrunkBalance } from "../../everyday/internal/prepareBearingTrunkBalance";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { prepareSupportCorrection } from "./prepareSupportCorrection";

/*
 * Apply the authored clock of a support action or its composition after the
 * constraint keys fix their times.
 */
export function supportBalance<P extends HumanPhysics.IBalanced>(
  context: IAutoMovieMotionHumanActionContext<P>,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    context.params,
    {},
    context.start,
    plan,
    context.instant,
  );
  if (window === null)
    return { ...plan, ...HumanPhysics.declared(context.params, null) };
  // Lumbar rotation preserves lower-body contacts directly. A pinned arm or
  // pelvis instead requires the constrained fit on that sample's actual anchors.
  const pinned: boolean = plan.contacts.some(
    (contact) =>
      upper(contact) &&
      HumanPhysics.intersects(
        window,
        plan.duration * contact.from,
        plan.duration * contact.to,
      ),
  );
  const adjust: ReturnType<typeof prepareBearingTrunkBalance> =
    window.by === "trunk" && !pinned
      ? prepareBearingTrunkBalance(
          context.body,
          window,
          plan.duration,
          plan.contacts,
        )
      : prepareSupportCorrection(context.body, window, plan);
  // The correction is solved at its knots on the plan's own posture and read
  // from their course (`prepareHumanPostureCorrection`): the support changes
  // where a contact window opens or closes.
  const corrected: ReturnType<typeof prepareHumanPostureCorrection> =
    prepareHumanPostureCorrection(
      (seconds: number): IAutoMovieMotionHumanPosture => plan.posture(seconds),
      window,
      plan.contacts.flatMap(
        (contact: IAutoMovieMotionHumanContactWindow): number[] => [
          contact.from * plan.duration,
          contact.to * plan.duration,
        ],
      ),
      (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => adjust(posture, seconds),
      {
        root: HumanBalance.TOLERANCE,
        angle: ROM_TOLERANCE,
        step: AutoMovieMotionHumanArmCourse.STEP,
      },
    );
  return {
    ...plan,
    ...HumanPhysics.declared(context.params, window),
    posture: (seconds, channels, resolution, projection) =>
      corrected(
        plan.posture(seconds, channels, resolution, projection),
        seconds,
      ),
  };
}

/*
 * Contacts carried on the lumbar subtree by the whole-body key fit.
 */
function upper(contact: IAutoMovieMotionHumanContactWindow): boolean {
  return (
    contact.part === "back" ||
    contact.part.endsWith("Arm") ||
    contact.part.endsWith("Hand")
  );
}
