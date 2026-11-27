import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanRide } from "../lexicon/HumanRide";
import { poseBones } from "../posture/internal/poseBones";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";

type Params = IAutoMovieMotionHumanPlayground.ISwingPumpParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** A point in the swing's plane: forward `z` then up `y`, metres from the pivot. */
type PlanePoint = readonly [number, number];

/** One body part turning on a circle in the swing's plane. */
interface ITurningPart {
  /** Mass, kilograms. */
  mass: number;

  /** The centre it turns about. */
  centre: PlanePoint;

  /** Its centre of mass's distance from that centre, metres. */
  radius: number;

  /** Start and end angles from forward toward up, radians. */
  from: number;

  /** End angle, radians. */
  to: number;
}

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Seconds each change of posture takes, centred on the seat's turning point
 * (provisional staging).
 */
const TURN: number = 0.3;

/**
 * Sampling step that locates the seat's turning points, seconds: finer than any
 * swing's half period.
 */
const STEP: number = 1 / 120;

/**
 * How far past the straightened arm's reach a shoulder may lie from the wrist
 * its chain grip takes at full lean, metres: the 10 mm skin a held site allows
 * its hand.
 */
const SLIP: number = 0.01;

/**
 * Knee flexion of the tucked and of the extended seated posture, degrees
 * (provisional staging).
 */
const TUCKED: number = 90;

/** Knee flexion with the legs extended forward, degrees (provisional staging). */
const EXTENDED: number = 15;

/**
 * Pump a swing from the seat: the seated ride with the hands on the chains
 * (`HumanRide`), leaning back with the legs extended while the seat swings
 * forward along the rider's facing and sitting up with the knees bent while it
 * swings back, each change centred on the turning point the scene's seat
 * passes. Seated pumping turns the body at the turning points (Case and
 * Swanson, Am J Phys 58:463, 1990; Wirkus, Rand and Ruina, College Math J
 * 29:266, 1998, https://www.maa.org/pubs/CMJ_September98.html); `increment`
 * gives the swing angle one such turn adds for this body.
 *
 * @param context The seated entry, the hanging seat and the lean.
 * @returns The seated ride with the pumping posture.
 * @throws {HumanRefusal} For a lean out of range or beyond the arms' reach on
 *   the chains, a rider wider across the seated thighs than the seat, or a ride
 *   the seat refuses.
 */
export function HumanSwingPump(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const { on, seat, hands, duration: seconds, lean }: Params = context.params;
  HumanBound.within("lean", lean, 0, 45, "deg");

  // A rider wider across the seated thighs than the seat is refused.
  const width: number | undefined = context
    .prop(on)
    .prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === seat,
    )?.width;
  const breadth: number =
    2 * (context.body.measure.hipHalfWidth + context.body.measure.thighRadius);
  if (width !== undefined && breadth > width)
    throw new HumanRefusal({
      kind: "reach",
      axis: "seat",
      value: seat,
      feasible: { kind: "range", minimum: 0, maximum: width, unit: "m" },
      reason: `the rider's seated breadth of ${breadth.toFixed(3)} m exceeds the ${width.toFixed(3)} m seat`,
      fix: "seat a smaller rider or choose a wider seat",
    });
  const ride: Plan = HumanRide.ride.plan({
    ...context,
    params: { on, duration: seconds, seat, hands },
  });
  const facing: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(UP, context.entry.posture.yaw),
    { x: 0, y: 0, z: 1 },
  );
  const seatAt = (at: number): IAutoMovieVector3 =>
    context.aim({ kind: "prop", subject: on, point: seat }, context.start + at)
      .point;
  const forward = (at: number): number =>
    Vector3.dot(
      Vector3.subtract(seatAt(at + STEP / 2), seatAt(at - STEP / 2)),
      facing,
    );

  // The turning points: where the seat's velocity along the facing changes sign.
  const turns: number[] = [];
  let previous: number = forward(0);
  for (let at: number = STEP; at <= ride.duration; at += STEP) {
    const now: number = forward(at);
    if (now !== 0 && previous !== 0 && Math.sign(now) !== Math.sign(previous))
      turns.push(at - STEP / 2);
    if (now !== 0) previous = now;
  }
  const first: number = forward(STEP) > 0 ? 1 : 0;

  // 1 leaning back with the legs extended, 0 sitting up tucked.
  const pumped = (at: number): number => {
    let share: number = first;
    for (const turn of turns) {
      const progress: number = minimumJerk.share(
        (at - (turn - TURN / 2)) / TURN,
      );
      if (progress <= 0) break;
      share = share + (1 - 2 * share) * progress;
      if (progress < 1) break;
    }
    return share;
  };
  const pumping = (at: number): Posture => {
    const posture: Posture = ride.posture(at);
    // The pumping posture grows from the seated entry while the hands take
    // the chains, so the ride begins where the sit ended.
    const share: number =
      pumped(at) * minimumJerk.share(Math.min(1, at / HumanRide.TAKE));
    const spine: readonly [number, number, number] = posture.joints.spine ?? [
      0, 0, 0,
    ];
    const knee: number = TUCKED + (EXTENDED - TUCKED) * share;
    const left: readonly [number, number, number] = posture.joints
      .leftLowerLeg ?? [0, 0, 0];
    const right: readonly [number, number, number] = posture.joints
      .rightLowerLeg ?? [0, 0, 0];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [spine[0] - lean * share, spine[1], spine[2]],
        leftLowerLeg: [knee, left[1], left[2]],
        rightLowerLeg: [knee, right[1], right[2]],
      },
    };
  };

  // The hands must keep the chains at full lean: a lean that carries a
  // shoulder further from the wrist its chain grip takes than the
  // straightened arm reaches is refused, never left to slip. The shoulder
  // is read off the posture and the wrist off the grip's own goal, so no
  // stretch the arm's fit gives can hide the reach.
  const middles: number[] = [0, ...turns, ride.duration]
    .slice(1)
    .map((turn: number, index: number, ends: number[]): number =>
      index === 0 ? turn / 2 : (ends[index - 1]! + turn) / 2,
    );
  const full: number | undefined = middles.find(
    (at: number): boolean => pumped(at) === 1,
  );
  if (full !== undefined) {
    const leaning: Posture = pumping(full);
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      resolveHumanPosture(context.body, leaning),
    );
    for (const side of ["left", "right"] as const) {
      const wrist: IAutoMovieVector3 | undefined =
        hands[side] === undefined
          ? undefined
          : leaning.limbs[`${side}Arm`]?.point;
      if (wrist === undefined) continue;
      const slip: number =
        Vector3.distance(bones.get(`${side}UpperArm`)!.worldPosition, wrist) -
        (context.body.measure.upperArm + context.body.measure.forearm);
      if (slip > SLIP)
        throw new HumanRefusal({
          kind: "reach",
          axis: "lean",
          value: lean,
          feasible: null,
          reason: `at ${lean} degrees of lean the ${side} shoulder lies ${slip.toFixed(3)} m beyond the straightened arm's reach of its chain grip`,
          fix: "lean back less, or hold the chains lower",
        });
    }
  }
  return { ...ride, posture: pumping };
}

/** The swing angle a seated rider's change of posture adds at a turning point. */
export namespace HumanSwingPump {
  /** Only the lengths and body mass used by the swing's moment balance. */
  export interface IIncrementBody {
    profile: Pick<IAutoMovieMotionHumanBody["profile"], "mass">;
    measure: Pick<
      IAutoMovieMotionHumanBody["measure"],
      "shoulderHeight" | "hipHeight" | "thigh" | "shank"
    >;
  }

  /**
   * The swing angle one change between the tucked and the leaning posture adds,
   * by conservation of angular momentum about the pivot while the body turns at
   * a turning point, where the swing is still (Wirkus, Rand and Ruina 1998).
   * The body is point masses at its segments' centres of mass, with Winter's
   * mass fractions and centre-of-mass ratios (Winter, Biomechanics and Motor
   * Control of Human Movement, 4th ed., Table 4.1): head, arms and trunk 0.678
   * at 0.626 of the hip-to-shoulder length, thighs 0.100 at 0.433, shanks
   * 0.0465 at 0.433 and feet 0.0145 at the ankle. The hip sits at the seat and
   * the thighs stay level; the trunk turns back by `lean` and the shanks swing
   * from hanging to level.
   *
   * @param body The rider.
   * @param hang Pivot to seat, metres.
   * @param lean The trunk's lean back, degrees.
   * @returns The added swing angle, degrees.
   */
  export function increment(
    body: IIncrementBody,
    hang: number,
    lean: number,
  ): number {
    const mass: number = body.profile.mass;
    const trunk: number = body.measure.shoulderHeight - body.measure.hipHeight;
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;

    // Positions in the swing's plane: z forward, y up, the pivot at the origin.
    const hip: PlanePoint = [0, -hang];
    const knee: PlanePoint = [thigh, -hang];
    const tilt: number = lean * Quaternion.DEG2RAD;

    // Each part: mass, its centre of rotation, radius, start and end angle (radians from +z toward +y).
    const parts: readonly ITurningPart[] = [
      {
        mass: 0.678 * mass,
        centre: hip,
        radius: 0.626 * trunk,
        from: Math.PI / 2,
        to: Math.PI / 2 + tilt,
      },
      {
        mass: 2 * 0.0465 * mass,
        centre: knee,
        radius: 0.433 * shank,
        from: -Math.PI / 2,
        to: 0,
      },
      {
        mass: 2 * 0.0145 * mass,
        centre: knee,
        radius: shank,
        from: -Math.PI / 2,
        to: 0,
      },
    ];
    const level: number = 2 * 0.1 * mass;
    const thighAt: PlanePoint = [0.433 * thigh, -hang];

    // The internal angular momentum the turn sweeps: for a point on a
    // circle of radius r about centre c, the integral of r x dr is
    // c x (q2 - q1) + r^2 (b2 - b1).
    let swept: number = 0;
    let inertia: number = level * (thighAt[0] ** 2 + thighAt[1] ** 2);
    for (const { mass: m, centre, radius, from, to } of parts) {
      const q1: PlanePoint = [radius * Math.cos(from), radius * Math.sin(from)];
      const q2: PlanePoint = [radius * Math.cos(to), radius * Math.sin(to)];
      swept +=
        m *
        (centre[0] * (q2[1] - q1[1]) -
          centre[1] * (q2[0] - q1[0]) +
          radius * radius * (to - from));
      for (const q of [q1, q2])
        inertia +=
          (m / 2) * ((centre[0] + q[0]) ** 2 + (centre[1] + q[1]) ** 2);
    }
    return Math.abs(swept / inertia) / Quaternion.DEG2RAD;
  }
}
