import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHookSet,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { wardrobeHands } from "../../dressing/internal/wardrobeHands";
import { hookSetTip } from "./hookSetTip";

/*
 * Set the hook. The hand holding the rod turns it about the grip, the tip
 * rising by the authored angle on a minimum-jerk course in the authored time (a
 * sharp lift), about the horizontal axis square to the rod; the grip stays
 * where it is, so the rod turns in the hand's own rotation and the arm follows
 * the hand's goal. The set is held a beat. A rod not held, a lift outside 0 to
 * `hookSetTip.LIFT` or a time of no length is refused; a grip the arm cannot
 * keep is refused by the reach check.
 */
export const hookSet: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHookSet> =
  {
    name: "hookSet",
    interrupts: {
      any: [{ window: { start: "set", end: 1 }, kind: "inertialize", entry: 0 }],
    },
    plan: planHookSet,
  };

/*
 * Set the hook. The hand holding the rod turns it about the grip, the tip
 * rising by the authored angle on a minimum-jerk course in the authored time (a
 * sharp lift), about the horizontal axis square to the rod; the grip stays
 * where it is, so the rod turns in the hand's own rotation and the arm follows
 * the hand's goal. The set is held a beat. A rod not held, a lift outside 0 to
 * `hookSetTip.LIFT` or a time of no length is refused; a grip the arm cannot
 * keep is refused by the reach check.
 */
function planHookSet(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHookSet>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const hand: AutoMovieHumanSide =
    params.hand ?? (entry.holds.right === params.rod ? "right" : "left");
  const held: ReturnType<typeof AutoMovieMotionHumanHeld> =
    AutoMovieMotionHumanHeld(context, hand, params.rod);
  const grip: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    entry.posture,
    hand,
  );
  const tip: hookSetTip.ITip = hookSetTip(
    context.prop(params.rod).frame(context.start).rotation,
    grip,
    params,
  );
  const duration: number = tip.duration;
  const turned: (t: number) => IAutoMovieRigidTransform = tip.turned;
  const arm: ReturnType<typeof wardrobeHands.prepareArm> =
    wardrobeHands.prepareArm(
      body,
      () => entry.posture,
      hand,
      turned,
      duration,
      [params.duration],
    );
  const posture: (t: number) => IAutoMovieMotionHumanPosture = (
    t: number,
  ): IAutoMovieMotionHumanPosture => arm(entry.posture, t);
  wardrobeHands.verify(
    context,
    posture(params.duration),
    hand,
    turned(params.duration),
    wardrobeHands.MISS,
  );
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );
  return {
    ...base,
    // The rod hand takes the rod's hold over and leaves it held.
    contacts: [...base.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [AutoMovieMotionHumanHeld.hold(context, held)],
    events: tip.events,
    hands: [hand],
    posture,
  };
}
