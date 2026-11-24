import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

type Ride = ReturnType<typeof rideHorse>;

/**
 * Seconds the rider sits on the standing horse before its course starts, as the
 * equestrian exercise does.
 */
const WAIT: number = 6;

/** The rider attachment campaign's contact drift bound, metres. */
const CONTACT: number = 0.01;

/** The horse's published jump events, film seconds. */
interface IJumpCues {
  /** The rider's approach posture begins. */
  approach: number;
  /** Final hind liftoff. */
  takeoff: number;
  /** First fore landing. */
  landing: number;
  /** The rider's recovery ends. */
  recovery: number;
}

/**
 * A rider follows the horse's own planned jump over a vertical: the horse's
 * trajectory is the same unmounted and ridden, and seat, stirrups and reins
 * hold against the actual tack.
 *
 * Scenarios:
 *
 * 1. The horse plans a jump over a 1.0 m vertical; a second, unmounted ride with
 *    the same inputs flies the same trajectory, and the ridden prop shows that
 *    trajectory.
 * 2. The rider reads the horse's approach, takeoff, landing and recovery cues:
 *    both stirrup balls and both wrists stay within 10 mm of their places in
 *    the stirrup and rein frames from approach through recovery, the seat
 *    leaves the saddle in flight, and at the first left fore touchdown after
 *    recovery the seat is back where it sat at the last one before the
 *    approach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the obstacle, the horse events, the contacts and the bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed rider joints, seat region and foot sockets against the horse's published seat, stirrup and rein frames, and compares two horse rides.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm bound is the rider attachment contract's; the cue times are the horse's own events; touchdowns compare the seat at the same stride event.
 * @evidence contracts/development/testing.md#distinguishing-cases Grounded approach, flight and recovery; both sides. The horse's clearance, baulk and refusals are owned by test_archetype_equine_jump.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only HumanPerformance with one generated polygon man and native horse rides.
 */
export function test_motion_mount_equestrian_jump(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    withersHeight: 1.72,
    tempo: 0,
  });
  const course: Parameters<typeof rideHorse>[1] = {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 5,
    startSpeed: 5,
    endSpeed: 5,
    legs: [
      {
        kind: "straight",
        length: 40,
        gait: "canter",
        lead: "left",
        equineFootwork: { kind: "jump", clearance: 0.1 },
      },
    ],
    footing: {
      planes: [
        {
          id: "lane",
          origin: { x: 0, y: 0, z: 0 },
          x: [-4, 4],
          z: [-10, 60],
          slope: { x: 0, z: 0 },
        },
      ],
      poles: [
        {
          id: "rail",
          from: { x: -2, y: 1, z: 20 },
          to: { x: 2, y: 1, z: 20 },
          radius: 0.05,
        },
      ],
    },
  };
  const ride: Ride = rideHorse(horse, course);
  const unmounted: Ride = rideHorse(horse, course);
  const issues: string[] = [];
  const cues: IJumpCues = {
    approach: WAIT + cue(ride, "jumpApproach"),
    takeoff: WAIT + cue(ride, "jumpTakeoff"),
    landing: WAIT + cue(ride, "jumpLanding"),
    recovery: WAIT + cue(ride, "jumpRecovery"),
  };
  const seconds = (at: number): number => Math.max(0, at - WAIT);
  const place = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(seconds(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform =>
    ride.frame(id as Parameters<Ride["frame"]>[0], seconds(at));
  const strides: readonly IAutoMovieScheduleCue[] = ride.instants
    .filter((event): boolean => event.label === "leftForeOn")
    .map(
      (event): IAutoMovieScheduleCue => ({
        name: "canter",
        seconds: WAIT + event.seconds,
      }),
    );
  const single = (name: string, at: number): IAutoMovieScheduleCue[] => [
    { name, seconds: at },
  ];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const seat = HumanObject.seat(ride.at(0).archetype, place(0));
  const film: HumanPerformance = new HumanPerformance({
    seed: "equine-jump",
    cues: {
      canter: strides,
      approach: single("approach", cues.approach),
      takeoff: single("takeoff", cues.takeoff),
      landing: single("landing", cues.landing),
      recovery: single("recovery", cues.recovery),
    },
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    performers: [
      {
        subject: "rider",
        body,
        at: HumanFrame.point(
          { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("rider")
      .sit({ seat, hold: 0.5 })
      .registered("ride", {
        on: "horse",
        duration: WAIT + ride.duration - 0.5,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        hands: { left: "leftRein", right: "rightRein" },
        equestrian: {
          stride: { cue: "canter", gait: "canter", lead: "left" },
          jump: {
            approach: "approach",
            takeoff: "takeoff",
            landing: "landing",
            recovery: "recovery",
          },
        },
      }).node,
  });

  // 1. The same trajectory unmounted and ridden.
  for (let at: number = cues.approach; at <= cues.recovery; at += 0.05) {
    const flown: IAutoMovieVector3 = film.prop("horse", at).position;
    if (
      Vector3.distance(
        unmounted.at(seconds(at)).placement.translation,
        ride.at(seconds(at)).placement.translation,
      ) !== 0 ||
      Vector3.distance(flown, ride.at(seconds(at)).placement.translation) > 1e-9
    )
      issues.push(`the ridden horse leaves its trajectory at ${at}`);
  }
  if (
    !(
      ride.at(seconds((cues.takeoff + cues.landing) / 2)).placement.translation
        .y > 0.3
    )
  )
    issues.push("the horse does not rise in flight");

  // 2. Contacts against the actual tack.
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "rider",
    body,
    0,
  );
  const baseline: number = cues.approach;
  for (let at: number = cues.approach; at <= cues.recovery; at += 0.05)
    for (const side of ["left", "right"] as const) {
      if (Vector3.distance(ball(side, at), ball(side, baseline)) > CONTACT)
        issues.push(`${side} stirrup drifts at ${at}`);
      if (Vector3.distance(hand(side, at), hand(side, baseline)) > CONTACT)
        issues.push(`${side} rein drifts at ${at}`);
    }
  const before: number | undefined = strides
    .map((event: IAutoMovieScheduleCue): number => event.seconds)
    .filter((at: number): boolean => at < cues.approach)
    .pop();
  const after: number | undefined = strides
    .map((event: IAutoMovieScheduleCue): number => event.seconds)
    .find((at: number): boolean => at > cues.recovery);
  if (before === undefined || after === undefined)
    issues.push("no touchdowns bracket the jump");
  else if (Vector3.distance(seatPoint(after), seatPoint(before)) > CONTACT)
    issues.push("the seat is not reacquired after recovery");
  if (
    before !== undefined &&
    !(
      seatPoint((cues.takeoff + cues.landing) / 2).y >
      seatPoint(before).y + CONTACT
    )
  )
    issues.push("the seat does not leave the saddle in flight");
  assertTakeClean("the jump under the rider", film);
  TestValidator.equals("rider contacts through the jump", issues, []);

  /** The seat region in the saddle's current frame. */
  function seatPoint(at: number): IAutoMovieVector3 {
    return local(part("seat", at), HumanSignature.region(reader, "seat", at));
  }

  /** A foot's ball socket in its stirrup's current frame. */
  function ball(side: AutoMovieHumanSide, at: number): IAutoMovieVector3 {
    return local(
      part(`${side}Stirrup`, at),
      HumanFoot.sockets(body, HumanSignature.bones(reader, at), side).find(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.socket === "ball",
      )!.point,
    );
  }

  /** A wrist in its rein's current frame. */
  function hand(side: AutoMovieHumanSide, at: number): IAutoMovieVector3 {
    return local(
      part(`${side}Rein`, at),
      HumanSignature.joint(reader, at, `${side}Hand`),
    );
  }
}

/** A published instant of the horse's ride. */
function cue(ride: Ride, label: string): number {
  const found: number | undefined = ride.instants.find(
    (event): boolean => event.label === label,
  )?.seconds;
  if (found === undefined)
    throw new Error(`The horse did not publish ${label}`);
  return found;
}

/** A world point in a frame's own axes. */
function local(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}
