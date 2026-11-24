import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

type Horse = ReturnType<typeof createHorse>;
type Ride = ReturnType<typeof rideHorse>;

const WAIT: number = 6;
const CONTACT: number = 0.01;

/**
 * The gaits these takes ride, each with its speed: walk, trot and canter; the
 * gallop is not ridden here.
 */
type Ridden = Exclude<IAutoMovieMotionHumanRide.EquestrianGait, "gallop">;

/**
 * The physical rider remains on the emitted horse equipment across 200 seeds.
 *
 * Scenarios:
 *
 * 1. Two hundred seeded horses, cycling walk, trot and canter, each carry a rider
 *    whose seat and both stirrup soles stay within 10 mm of the actual tack at
 *    three sampled strides.
 * 2. A rising trot sits on one diagonal's touchdowns, rises on the other
 *    diagonal's, and keeps both stirrups.
 * 3. The smallest rider on the tallest horse's longest stirrups refuses a rising
 *    trot because a foot rests on nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual seeded tack contact matrix, explicit fitted drop, published diagonal timing and an independently unreachable support.
 * @evidence contracts/development/testing.md#behavioral-verification Produces actual horse models and moving HumanPerformance samples, checking the rider seat and two foot balls against the world tack callbacks. It also verifies positive post displacement in the opposite diagonal interval and a measured support refusal.
 * @evidence contracts/development/testing.md#independent-expectations The actual rendered seat region and foot sockets supply positions. The original campaign's tolerance is 10 mm. Published simultaneous diagonal touchdowns supply the child's time oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts all demonstrated seed geometries across three carriage clocks, each diagonal with the middle of posting, and the shortest rider against long admitted stirrups.
 * @evidence contracts/development/testing.md#execution-ownership Bounded in-memory samples over public horse and rider tools. The existing horse test independently keeps ownership of the empirical 200-seed stride-time witness.
 */
export function test_motion_mount_equestrian_seeded_contacts(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (let seed: number = 0; seed < 200; seed++) {
    const gait = (["walk", "trot", "canter"] as const)[seed % 3]!;
    observe(`seed ${seed} ${gait}`, () => {
      const horse: Horse = createHorse({ stirrupDrop: 0.66 }, seed);
      const take: Take = mounted(horse, body, gait);
      const duration: number = take.ride.duration;
      inspect(take, [
        WAIT + 0.32 * duration,
        WAIT + 0.42 * duration,
        WAIT + 0.53 * duration,
      ]);
    });
  }

  observe("the first and opposite actual trot diagonals", () => {
    const horse: Horse = createHorse({ stirrupDrop: 0.66, tempo: 0 }, 6);
    const take: Take = mounted(horse, body, "trot", true);
    const [on, next] = take.diagonal;
    const off: number | undefined = take.ride.instants.find(
      (event): boolean =>
        event.label === "rightForeOn" &&
        event.seconds + WAIT > on! &&
        event.seconds + WAIT < next!,
    )?.seconds;
    if (
      off === undefined ||
      !take.ride.instants.some(
        (event): boolean =>
          event.label === "leftHindOn" && event.seconds === off,
      )
    )
      throw new Error(
        "The other actual diagonal must fall within the selected cycle",
      );
    const high: number = seat(take, off + WAIT).y;
    if (
      !(
        high - seat(take, on!).y > 0.015 &&
        Math.abs(seat(take, on!).y - seat(take, next!).y) < CONTACT
      )
    )
      throw new Error(
        "The seat must rise on the opposite diagonal and return on the selected diagonal",
      );
    for (const side of ["left", "right"] as const)
      if (
        Vector3.distance(foot(take, side, on!), foot(take, side, off + WAIT)) >
        CONTACT
      )
        throw new Error(`${side} stirrup releases during the posted diagonal`);
  });

  let error: unknown = null;
  try {
    const horse: Horse = createHorse(
      { withersHeight: 1.8, stirrupDrop: 0.775 },
      6,
    );
    const tooShort: Take = mounted(
      horse,
      motionHumanBody("f-small"),
      "trot",
      true,
    );
    foot(tooShort, "left", WAIT + tooShort.ride.duration / 2);
  } catch (failure) {
    error = failure;
  }
  if (
    !(
      error instanceof HumanRefusal &&
      error.kind === "affordance" &&
      error.axis === "rising" &&
      error.reason.includes("a foot of the rider rests on nothing") &&
      error.feasible?.kind === "alternatives" &&
      error.feasible.values.includes("seated")
    )
  )
    findings.push(
      `An unreachable stirrup asks for a typed physical support refusal, got ${String(error)}`,
    );

  TestValidator.equals(
    "actual seeded seat, sole contacts and diagonal evidence",
    findings,
    [],
  );

  /** Record each seed and failure mode before asserting the complete round. */
  function observe(label: string, run: () => void): void {
    try {
      run();
    } catch (failure) {
      findings.push(
        `${label}: ${failure instanceof Error ? failure.message : String(failure)}`,
      );
    }
  }
}

/** The actual moving tack, current rider geometry and published posting cues. */
interface Take {
  film: HumanPerformance;
  ride: Ride;
  reader: IAutoMovieMotionHumanSignature.IReader;
  body: IAutoMovieMotionHumanBody;
  part: (id: string, at: number) => IAutoMovieTransform;
  diagonal: readonly number[];
}

/** Build a genuine rider holding the actual changing native tack. */
function mounted(
  horse: Horse,
  body: IAutoMovieMotionHumanBody,
  gait: Ridden,
  rising: boolean = false,
): Take {
  const scale: number = Math.sqrt(horse.dimensions.withersHeight! / 1.38);
  const speed: number =
    ({ walk: 1.4, trot: 3, canter: 5 } as const)[gait] * scale;
  const ride: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
      legs: [{ kind: "straight", length: speed * 3 }],
    },
    gait,
  );
  const seconds = (at: number): number => Math.max(0, at - WAIT);
  const place = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(seconds(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform =>
    ride.frame(id as Parameters<Ride["frame"]>[0], seconds(at));
  const diagonal: number[] = [];
  if (rising) {
    const hind: Set<number> = new Set(
      ride.instants
        .filter((event): boolean => event.label === "rightHindOn")
        .map((event): number => event.seconds),
    );
    for (const event of ride.instants)
      if (
        event.label === "leftForeOn" &&
        event.seconds > 0.1 &&
        hind.has(event.seconds)
      )
        diagonal.push(WAIT + event.seconds);
    if (diagonal.length < 2)
      throw new Error("The actual selected diagonal must land twice");
  }
  const saddle = HumanObject.seat(ride.at(0).archetype, place(0));
  const film: HumanPerformance = new HumanPerformance({
    seed: "equine-contact-seed",
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    cues: {
      diagonal: diagonal.map((seconds: number) => ({
        name: "left fore + right hind",
        seconds,
      })),
    },
    performers: [
      {
        subject: "rider",
        body,
        at: HumanFrame.point(
          { origin: { ...saddle.at, y: 0 }, yaw: saddle.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: saddle.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("rider")
      .sit({ seat: saddle, hold: 0.5 })
      .registered("ride", {
        on: "horse",
        duration: WAIT + ride.duration,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        ...(rising ? { rising: { cue: "diagonal" } } : {}),
      }).node,
  });
  return {
    film,
    ride,
    reader: HumanSignature.of(film, "rider", body, 0),
    body,
    part,
    diagonal,
  };
}

/** Measure consistent actual saddle and foot contact on each selected stride. */
function inspect(take: Take, times: readonly number[]): void {
  assertTakeClean("a seeded mounted take", take.film);
  const initial: number = times[0]!;
  const seated: IAutoMovieVector3 = seat(take, initial);
  const rested: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: foot(take, "left", initial),
    right: foot(take, "right", initial),
  };
  for (const time of times) {
    const current: IAutoMovieVector3 = seat(take, time);
    if (
      Math.abs(current.y) > CONTACT ||
      Vector3.distance(current, seated) > CONTACT
    )
      throw new Error(`seat separates or slides at ${time}`);
    for (const side of ["left", "right"] as const) {
      const relative: IAutoMovieVector3 = foot(take, side, time);
      if (
        Vector3.distance(relative, rested[side]) > CONTACT ||
        Math.abs(relative.y) > CONTACT
      )
        throw new Error(`${side} sole leaves the actual stirrup at ${time}`);
    }
  }
}

/** Read the displayed sole ball against the actual sampled equipment. */
function foot(
  take: Take,
  side: AutoMovieHumanSide,
  at: number,
): IAutoMovieVector3 {
  const ball: IAutoMovieMotionHumanFoot.ISocket = HumanFoot.sockets(
    take.body,
    HumanSignature.bones(take.reader, at),
    side,
  ).find(
    (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
      socket.socket === "ball",
  )!;
  return local(take.part(`${side}Stirrup`, at), ball.point);
}

/** Read the displayed seat point against its actual sampled saddle. */
function seat(take: Take, at: number): IAutoMovieVector3 {
  return local(
    take.part("seat", at),
    HumanSignature.region(take.reader, "seat", at),
  );
}

/** World point resolved independently in its exact tack frame. */
function local(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}
