import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeQuadrupedGait,
  createHorse,
  createQuadruped,
  rideHorse,
} from "@automovie/archetypes";
import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRide,
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
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

type Horse = ReturnType<typeof createHorse>;
type Ride = ReturnType<typeof rideHorse>;
/** One rider stride track. */
type Stride = IAutoMovieMotionHumanRide.IEquestrianStride;

/** A gait's admitted speed band, m/s. */
type IGaitBand = ReturnType<typeof AutoMovieArchetypeQuadrupedGait.range>;

interface IWindow {
  /** Response and actual touchdown label used to publish the clock. */
  stride: Stride;
  hoof: string;
  /** Film-local boundaries agreed with the carrier event reader. */
  from: number;
  to: number;
}

interface ITake {
  film: HumanPerformance;
  body: IAutoMovieMotionHumanBody;
  part: (id: string, at: number) => IAutoMovieTransform;
  times: readonly (readonly number[])[];
  look: number;
}

const WAIT: number = 6;
const CONTACT: number = 0.01;
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * One rider keeps the same support through real gait, route and lead changes.
 *
 * Scenarios:
 *
 * 1. One ride walks, trots, canters through a 25 degree turn and trots again; each
 *    gait's own hoof track drives a measurable pelvis and relative chest
 *    response while seat and stirrups hold.
 * 2. An over-shoulder look during the trot turns the head past the side and
 *    returns, with the pelvis kept forward.
 * 3. A flying change from the left to the right canter lead banks the pelvis to
 *    opposite sides, and seat and stirrups hold across the change.
 * 4. Two touchdown tracks that overlap in time refuse with `equestrian.stride`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies actual course, hoof-event clocks, grounded saddle and stirrup observations, pelvis and lumbar response, lead mirror and over-shoulder recovery.
 * @evidence contracts/development/testing.md#behavioral-verification Builds two native horse paths, prepares one complete carried rider for each, measures effective pose axes and human seat and foot points in the published current tack frames.
 * @evidence contracts/development/testing.md#independent-expectations Committed event labels partition the authored course. Actual model frames supply the seat and stirrup coordinates independently of rider goal inputs. A local axis sign distinguishes opposite leads, and the 10 mm contact budget is inherited from the rider attachment contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts walk, trot, banked left and right leads, the neutral join, active head overlay and return, plus overlapping authored windows.
 * @evidence contracts/development/testing.md#execution-ownership Uses deterministic in-memory actual horse and HumanPerformance owners with sparse event-relative witnesses and no external renderer.
 */
export function test_motion_mount_equestrian_timeline(): void {
  const horse: Horse = createHorse({ withersHeight: 1.72, tempo: 0 });
  const withers: number = horse.dimensions.withersHeight!;
  const reference: createQuadruped.ISpecies = createQuadruped.species(horse);
  const trot: number =
    1.6 *
    Math.sqrt(
      0.35 *
        AutoMovieGravity.STANDARD *
        AutoMovieArchetypeEquine.rig(horse.dimensions).limbs.leftHind[0]!.y,
    );
  const canterBand: IGaitBand = AutoMovieArchetypeQuadrupedGait.range(
    reference,
    "canter",
    withers,
  );
  const gallopBand: IGaitBand = AutoMovieArchetypeQuadrupedGait.range(
    reference,
    "gallop",
    withers,
  );
  const overlap: number =
    (Math.max(canterBand.minimum, gallopBand.minimum) +
      Math.min(canterBand.maximum, gallopBand.maximum)) /
    2;
  const canter: number =
    (5 * (horse.dimensions.mass! / 170) ** 0.216 + overlap) / 2;
  const course: Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 22 },
      { kind: "turn", radius: 130, angle: 25 },
      { kind: "straight", length: 45 },
      { kind: "straight", length: 22 },
    ],
    cruise: canter,
    speeds: [trot, canter, trot, 0],
    acceleration: 1,
    deceleration: 1,
  });
  const change: number = cue(course, "gait:walk-trot");
  const go: number = cue(course, "gait:trot-canter");
  const leave: number = cue(course, "gait:canter-trot");
  const gaitWindows: readonly IWindow[] = [
    {
      stride: { cue: "walk", gait: "walk" },
      hoof: "leftHindOn",
      from: 0,
      to: change,
    },
    {
      stride: { cue: "trot", gait: "trot" },
      hoof: "leftForeOn",
      from: change,
      to: go,
    },
    {
      stride: { cue: "canter", gait: "canter" },
      hoof: "leftForeOn",
      from: go,
      to: leave,
    },
  ];
  const take: ITake = stage(horse, course, gaitWindows, true);
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    take.film,
    "rider",
    take.body,
    0,
  );
  for (let i: number = 0; i < take.times.length; i++) {
    const [start, end] = take.times[i]!;
    const during: number = start! + (end! - start!) * 0.31;
    const hips: number =
      axis(take, "hips", during, FORWARD).y -
      axis(take, "hips", start!, FORWARD).y;
    const chest: number =
      axis(take, "chest", during, FORWARD).y -
      axis(take, "chest", start!, FORWARD).y;
    TestValidator.predicate(
      `${gaitWindows[i]!.stride.gait} creates measurable pelvis and relative chest response`,
      () => Math.abs(hips) > 0.0007 && Math.abs(chest - hips) > 0.0007,
    );
    checkContacts(take, reader, start!, [during, end!]);
  }
  TestValidator.predicate(
    "the head turns over a shoulder and recovers while the pelvis stays forward",
    () =>
      axis(take, "head", take.look - 0.4, FORWARD).z > 0 &&
      axis(take, "head", take.look, FORWARD).z < 0 &&
      axis(take, "head", take.look + 0.4, FORWARD).z > 0 &&
      axis(take, "hips", take.look, FORWARD).z > 0,
  );

  const speed: number = 5.5 * Math.sqrt(withers / 1.38);
  const leads: Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "turn", radius: 140, angle: 18, gait: "canter", lead: "left" },
      { kind: "turn", radius: 140, angle: -18, gait: "canter", lead: "right" },
    ],
    cruise: speed,
    startSpeed: speed,
    endSpeed: speed,
  });
  const handover: number = cue(leads, "lead:left-right");
  const leadWindows: readonly IWindow[] = [
    {
      stride: { cue: "left", gait: "canter", lead: "left" },
      hoof: "leftForeOn",
      from: 0,
      to: handover,
    },
    {
      stride: { cue: "right", gait: "canter", lead: "right" },
      hoof: "rightForeOn",
      from: handover,
      to: leads.duration,
    },
  ];
  assertTakeClean("the gait timeline take", take.film);
  const moving: ITake = stage(horse, leads, leadWindows, false);
  assertTakeClean("the lead-change timeline take", moving.film);
  const both: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    moving.film,
    "rider",
    moving.body,
    0,
  );
  const banks: number[] = [];
  for (const [begin, end] of moving.times) {
    const at: number = begin! + (end! - begin!) / 3;
    banks.push(
      axis(moving, "hips", at, UP).x - axis(moving, "hips", begin!, UP).x,
    );
    checkContacts(moving, both, begin!, [at, end!]);
  }
  TestValidator.predicate(
    "opposite banks occur in one actual lead-changing ride",
    () =>
      banks.length === 2 &&
      Math.abs(banks[0]!) > 0.006 &&
      Math.abs(banks[1]!) > 0.006 &&
      banks[0]! * banks[1]! < 0,
  );
  checkContacts(moving, both, moving.times[0]![0]!, [
    WAIT + handover - 0.005,
    WAIT + handover,
    WAIT + handover + 0.005,
  ]);

  let rejection: unknown = null;
  try {
    stage(
      horse,
      leads,
      [
        leadWindows[0]!,
        { ...leadWindows[0]!, stride: { cue: "colliding", gait: "canter" } },
      ],
      false,
    ).film.segments("rider");
  } catch (error) {
    rejection = error;
  }
  TestValidator.predicate(
    "overlapping touchdown windows refuse",
    () =>
      rejection instanceof HumanRefusal &&
      rejection.axis === "equestrian.stride",
  );
}

/** Read the actual seam that the supplier published for this take. */
function cue(ride: Ride, label: string): number {
  const time: number | undefined = ride.instants.find(
    (event): boolean => event.label === label,
  )?.seconds;
  if (time === undefined)
    throw new Error(`Native supplier did not publish ${label}`);
  return time;
}

/** Keep one seat on the authored carrier while its selected hoof clocks change. */
function stage(
  horse: Horse,
  ride: Ride,
  windows: readonly IWindow[],
  look: boolean,
): ITake {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const seconds = (at: number): number => Math.max(0, at - WAIT);
  const place = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(seconds(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform =>
    ride.frame(id as Parameters<Ride["frame"]>[0], seconds(at));
  const timelines: readonly (readonly number[])[] = windows.map(
    (window: IWindow): readonly number[] =>
      ride.instants
        .filter(
          (event): boolean =>
            event.label === window.hoof &&
            event.seconds >= window.from &&
            event.seconds <= window.to,
        )
        .map((event): number => WAIT + event.seconds),
  );
  if (timelines.some((track: readonly number[]): boolean => track.length < 2))
    throw new Error(
      "Every actual gait or lead track must include a complete stride",
    );
  const lookTime: number = look
    ? (timelines[1]![0]! + timelines[1]![1]!) / 2
    : WAIT;
  const cueTracks: Record<string, readonly IAutoMovieScheduleCue[]> = {
    look: [{ name: "look", seconds: lookTime }],
  };
  windows.forEach((window: IWindow, index: number): void => {
    cueTracks[window.stride.cue] = timelines[index]!.map(
      (seconds: number): IAutoMovieScheduleCue => ({
        name: window.stride.cue,
        seconds,
      }),
    );
  });
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    ride.at(0).archetype,
    place(0),
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "equine-timeline",
    cues: cueTracks,
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
        duration: WAIT + ride.duration,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        equestrian: {
          stride: windows.map((window: IWindow): Stride => window.stride),
          ...(look
            ? { lookBack: { cue: "look", side: "left", duration: 0.8 } }
            : {}),
        },
      }).node,
  });
  return { film, body, part, times: timelines, look: lookTime };
}

/**
 * Observe one actual rig bone against the saddle independently of the motion
 * law.
 */
function axis(
  run: ITake,
  bone: AutoMovieHumanoidBone,
  at: number,
  along: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.multiply(
      Quaternion.inverse(run.part("seat", at).rotation),
      run.film.bones("rider", at).get(bone)!.worldRotation,
    ),
    along,
  );
}

/** Compare moving rider point contacts against independent current tack frames. */
function checkContacts(
  take: ITake,
  reader: IAutoMovieMotionHumanSignature.IReader,
  baseline: number,
  times: readonly number[],
): void {
  const seat = (at: number): IAutoMovieVector3 =>
    local(take.part("seat", at), HumanSignature.region(reader, "seat", at));
  for (const at of times) {
    TestValidator.predicate(
      `seat holds through film second ${at}`,
      () => Vector3.distance(seat(at), seat(baseline)) < CONTACT,
    );
    for (const side of ["left", "right"] as const) {
      const ball = (seconds: number): IAutoMovieVector3 =>
        local(
          take.part(`${side}Stirrup`, seconds),
          HumanFoot.sockets(
            take.body,
            HumanSignature.bones(reader, seconds),
            side,
          ).find((socket): boolean => socket.socket === "ball")!.point,
        );
      TestValidator.predicate(
        `${side} stirrup holds through film second ${at}`,
        () => Vector3.distance(ball(at), ball(baseline)) < CONTACT,
      );
    }
  }
}

/** Put a measured physical point in the current part's own axes. */
function local(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}
