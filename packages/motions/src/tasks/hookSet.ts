import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHookSet,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { wardrobeHands } from "../dressing/wardrobeHands";
import { HumanBound } from "../law/HumanBound";

/**
 * How long the set tip is held before the hand eases back, seconds
 * (provisional: a beat to feel the fish).
 */
const HOLD: number = 0.3;

/**
 * The most a hook set lifts the tip, degrees (provisional: from a rod held low
 * to upright).
 */
const LIFT: number = 90;

/**
 * Set the hook. The hand holding the rod turns it about the grip, the tip
 * rising by the authored angle on a minimum-jerk course in the authored time (a
 * sharp lift), about the horizontal axis square to the rod; the grip stays
 * where it is, so the rod turns in the hand's own rotation and the arm follows
 * the hand's goal. The set is held a beat. A rod not held, a lift outside 0 to
 * `LIFT` or a time of no length is refused; a grip the arm cannot keep is
 * refused by the reach check.
 */
function planHookSet(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHookSet>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  HumanBound.within("angle", params.angle, 0, LIFT, "deg");
  HumanBound.least("duration", params.duration, 1e-3, "s");
  const hand: AutoMovieHumanSide =
    params.hand ?? (entry.holds.right === params.rod ? "right" : "left");
  const held: ReturnType<typeof AutoMovieMotionHumanHeld> =
    AutoMovieMotionHumanHeld(context, hand, params.rod);
  const rod: IAutoMovieRigidTransform = context
    .prop(params.rod)
    .frame(context.start);
  const along: IAutoMovieVector3 = Quaternion.rotateVector(rod.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  // The tip rises about the horizontal axis square to the rod: a positive
  // turn about along x up carries the rod toward up.
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(along, { x: 0, y: 1, z: 0 }),
  );
  const grip: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    entry.posture,
    hand,
  );
  const duration: number = params.duration + HOLD;
  const turned: (t: number) => IAutoMovieRigidTransform = (
    t: number,
  ): IAutoMovieRigidTransform => ({
    position: grip.position,
    rotation: Quaternion.multiply(
      Quaternion.fromAxisAngle(
        axis,
        params.angle * minimumJerk(Math.min(1, t / params.duration)).s,
      ),
      grip.rotation,
    ),
  });
  const posture: (t: number) => IAutoMovieMotionHumanPosture = (
    t: number,
  ): IAutoMovieMotionHumanPosture =>
    wardrobeHands.arm(body, entry.posture, hand, turned(t));
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
    events: [
      { name: "set", share: params.duration / duration },
      { name: "relax", share: 1 },
    ],
    hands: [hand],
    posture,
  };
}

/**
 * Set the hook. The hand holding the rod turns it about the grip, the tip
 * rising by the authored angle on a minimum-jerk course in the authored time (a
 * sharp lift), about the horizontal axis square to the rod; the grip stays
 * where it is, so the rod turns in the hand's own rotation and the arm follows
 * the hand's goal. The set is held a beat. A rod not held, a lift outside 0 to
 * `LIFT` or a time of no length is refused; a grip the arm cannot keep is
 * refused by the reach check.
 */
export const hookSet: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHookSet> =
  {
    name: "hookSet",
    interrupts: {
      any: [{ window: ["set", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planHookSet,
  };
