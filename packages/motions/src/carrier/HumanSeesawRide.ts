import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRide } from "../lexicon/HumanRide";

type Params = IAutoMovieMotionHumanPlayground.ISeesawRideParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Sampling step that finds when the seat is low enough for the feet, seconds. */
const STEP: number = 1 / 120;

/** Seconds a foot takes to reach the ground or leave it (provisional staging). */
const PLACE: number = 0.25;

/** One interval with the feet on the ground, ride seconds. */
interface ILow {
  /** When the seat comes low enough. */
  from: number;

  /** When it rises out of reach. */
  to: number;

  /** Each foot's ankle goal on the ground, world metres. */
  ankles: Record<AutoMovieHumanSide, IAutoMovieVector3>;
}

/**
 * Ride a seesaw seat: the seated ride with the hands on the handles
 * (`HumanRide`), and the feet planted on the ground while the seat is low
 * enough that a vertical shank reaches it, so the rider can push off. The
 * feet are planted where the knees are ahead of the seat as it comes low,
 * and stay there until it rises out of reach.
 *
 * @param context The seated entry, the beam and its points.
 * @returns The ride with the ground contacts of the low end.
 * @throws {HumanRefusal} For a ride the seat refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ride it wraps, the reach rule and the plant.
 * @evidence contracts/development/implementation.md#principled-implementation The scene's seat height against the ankle's reach below the knee decides each low interval; the feet bear on the world while it lasts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the seated ride, find the low intervals once, then place the feet per sample.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The beam's angle is never authored here. The placing time is a named provisional staging value.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass at `STEP` over the duration; each sample scans the few low intervals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the seated ride's seat and grip fit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the low intervals and the ride plan for the action.
 */
export function HumanSeesawRide(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const { on, seat, hands, seconds }: Params = context.params;
  const ground: number = context.params.ground ?? 0;
  const ride: Plan = HumanRide.ride.plan({
    ...context,
    params: { on, seconds, seat, hands },
  });
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(UP, context.entry.posture.yaw),
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = Vector3.cross(UP, forward);
  const ankle: number = body.measure.ankleHeight;
  const reach: number = body.measure.shank + ankle;
  const hips: number = 2 * body.measure.hipHalfWidth;
  const seatAt = (at: number): IAutoMovieVector3 =>
    context.aim({ kind: "prop", subject: on, point: seat }, context.start + at)
      .point;

  // The low intervals: the seat no higher above the ground than the shank
  // and ankle reach, so a foot below the knee meets the ground.
  const lows: ILow[] = [];
  let open: number | undefined;
  for (let at: number = 0; at <= ride.duration + STEP / 2; at += STEP) {
    const low: boolean = seatAt(at).y - ground <= reach;
    if (low && open === undefined) open = at;
    if ((!low || at + STEP > ride.duration) && open !== undefined) {
      const from: IAutoMovieVector3 = seatAt(open);
      const knee: IAutoMovieVector3 = Vector3.add(
        { ...from, y: ground + ankle },
        Vector3.scale(forward, body.measure.thigh),
      );
      lows.push({
        from: open,
        to: Math.min(at, ride.duration),
        ankles: {
          left: Vector3.add(knee, Vector3.scale(across, hips / 2)),
          right: Vector3.add(knee, Vector3.scale(across, -hips / 2)),
        },
      });
      open = undefined;
    }
  }
  const contacts: IAutoMovieMotionHumanContactWindow[] = [...ride.contacts];
  for (const low of lows)
    for (const side of ["left", "right"] as const)
      contacts.push({
        part: `${side}Foot`,
        kind: "plant",
        from: Math.min(1, (low.from + PLACE) / ride.duration),
        to: Math.max(0, (low.to - PLACE) / ride.duration),
        support: { kind: "ground", height: ground },
      });
  return {
    ...ride,
    contacts,
    posture: (at: number): Posture => {
      const posture: Posture = ride.posture(at);
      const low: ILow | undefined = lows.find(
        (item: ILow): boolean => at >= item.from && at <= item.to,
      );
      if (low === undefined) return posture;
      const share: number =
        minimumJerk.share((at - low.from) / PLACE) *
        (1 - minimumJerk.share((at - (low.to - PLACE)) / PLACE));
      const seatNow: IAutoMovieVector3 = seatAt(at);
      const limbs: Posture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieVector3 = low.ankles[side];
        const carried: IAutoMovieHumanLimbGoal | undefined =
          posture.limbs[`${side}Leg`];
        const knee: IAutoMovieVector3 = {
          ...goal,
          y: Math.max(goal.y + body.measure.shank, seatNow.y),
        };
        limbs[`${side}Leg`] =
          carried === undefined
            ? { point: goal, bend: knee, planted: share >= 1 }
            : {
                ...carried,
                point: Vector3.lerp(carried.point, goal, share),
                bend: Vector3.lerp(carried.bend, knee, share),
                planted: share >= 1,
              };
      }
      return { ...posture, limbs };
    },
  };
}
