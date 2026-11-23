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
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRide } from "../lexicon/HumanRide";
import { poseBones } from "../posture/poseBones";

type Params = IAutoMovieMotionHumanPlayground.ISeesawRideParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Sampling step that finds when the seat is low enough for the feet, seconds. */
const STEP: number = 1 / 120;

/** Seconds a foot takes to reach the ground or leave it (provisional staging). */
const PLACE: number = 0.25;

/**
 * How high a foot arcs over the ground as it is placed or lifted, metres
 * (provisional staging).
 */
const LIFT: number = 0.05;

/**
 * How far ahead of the seat a planted ankle lies, thigh lengths: short of the
 * hanging knee, so the leg keeps slack as the seat rises to the end of its low
 * interval (provisional staging).
 */
const SLACK: number = 0.9;

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
 * (`HumanRide`), and the feet planted on the ground while the seat is so low
 * that the soles, hanging below it as the seated entry holds them, would meet
 * the ground, so the rider can push off. Each foot is placed where its knee is
 * ahead of the seat just before it comes that low, stays while it is, and is
 * lifted just after it rises again; no ankle ever goes below its height over
 * the ground.
 *
 * @param context The seated entry, the beam and its points.
 * @returns The ride with the ground contacts of the low end.
 * @throws {HumanRefusal} For a ride the seat refuses.
 */
export function HumanSeesawRide(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const { on, seat, hands, duration: seconds }: Params = context.params;
  const ground: number = context.params.ground ?? 0;
  const ride: Plan = HumanRide.ride.plan({
    ...context,
    params: { on, duration: seconds, seat, hands },
  });
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(UP, context.entry.posture.yaw),
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = Vector3.cross(UP, forward);
  const ankle: number = body.measure.ankleHeight;
  const hips: number = 2 * body.measure.hipHalfWidth;
  // A planted foot lies flat on the ground, turned to the rider's heading.
  const flat: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    UP,
    context.entry.posture.yaw,
  );
  const seatAt = (at: number): IAutoMovieVector3 =>
    context.aim({ kind: "prop", subject: on, point: seat }, context.start + at)
      .point;

  // The hanging soles' drop below the seat point, read from the seated
  // entry: a foot meets the ground once the seat is that low.
  const entered: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const drop: number =
    seatAt(0).y -
    Math.min(
      entered.get("leftFoot")!.worldPosition.y,
      entered.get("rightFoot")!.worldPosition.y,
    ) +
    ankle;

  // The low intervals: the hanging feet at or below the ground. Each foot
  // is placed `PLACE` before the seat gets that low and lifted `PLACE`
  // after it rises again, so it bears only while the seat is low.
  const lows: ILow[] = [];
  let open: number | undefined;
  for (let at: number = 0; at <= ride.duration + STEP / 2; at += STEP) {
    const low: boolean = seatAt(at).y - drop <= ground;
    if (low && open === undefined) open = at;
    if ((!low || at + STEP > ride.duration) && open !== undefined) {
      const from: IAutoMovieVector3 = seatAt(open);
      const knee: IAutoMovieVector3 = Vector3.add(
        { ...from, y: ground + ankle },
        Vector3.scale(forward, SLACK * body.measure.thigh),
      );
      if (Math.min(at, ride.duration) > open)
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
        from: low.from / ride.duration,
        to: low.to / ride.duration,
        support: { kind: "ground", height: ground },
      });
  const feet: Plan = {
    ...ride,
    contacts,
    posture: (at: number): Posture => {
      const posture: Posture = ride.posture(at);
      const low: ILow | undefined = lows.find(
        (item: ILow): boolean =>
          at >= item.from - PLACE && at <= item.to + PLACE,
      );
      if (low === undefined) return grounded(posture);
      const share: number =
        (low.from <= 0
          ? 1
          : minimumJerk.share((at - (low.from - PLACE)) / PLACE)) *
        (low.to >= ride.duration
          ? 1
          : 1 - minimumJerk.share((at - low.to) / PLACE));
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
            ? {
                point: goal,
                bend: knee,
                rotation: flat,
                planted: at >= low.from && at <= low.to,
              }
            : {
                ...carried,
                // The foot comes down onto the ground and lifts off it on
                // an arc, never dragging across it.
                point: Vector3.add(Vector3.lerp(carried.point, goal, share), {
                  x: 0,
                  y: LIFT * Math.sin(Math.PI * share),
                  z: 0,
                }),
                bend: Vector3.lerp(carried.bend, knee, share),
                rotation:
                  carried.rotation === undefined
                    ? flat
                    : Quaternion.slerp(carried.rotation, flat, share),
                planted: at >= low.from && at <= low.to,
              };
      }
      return grounded({ ...posture, limbs });
    },
  };

  return feet;

  // No ankle goes below its height over the ground: a foot the seat lowers
  // further than the shank reaches stands on the ground instead.
  function grounded(posture: Posture): Posture {
    const limbs: Posture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
      if (goal !== undefined && goal.point.y < ground + ankle)
        limbs[`${side}Leg`] = {
          ...goal,
          point: { ...goal.point, y: ground + ankle },
        };
    }
    return { ...posture, limbs };
  }
}
