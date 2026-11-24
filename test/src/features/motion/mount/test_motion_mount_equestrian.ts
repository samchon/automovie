import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanRide,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
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

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Film seconds of the authored actions on the travelling support. */
const WAIT: number = 6;
const LOOK: number = 8.5;
const APPROACH: number = 9.5;
const TAKEOFF: number = 10;
const LANDING: number = 10.5;
const RECOVERY: number = 11.25;
const FLIGHT: number = (TAKEOFF + LANDING) / 2;

/** The existing rider attachment campaign's contact drift bound in metres. */
const CONTACT: number = 0.01;

/** One staged ride, its tack and the first interval of the actual hoof clock. */
interface ITrial {
  /** The displayed human and prop reads. */
  film: HumanPerformance;
  /** The saddle or stirrup frame, sampled independently of the rider. */
  part(id: string, seconds: number): IAutoMovieTransform;
  /** Film seconds from one leading fore touchdown to its next. */
  stride: readonly [number, number];
}

/**
 * Equestrian rider articulation follows the support's cue clock and distinct
 * seat, stirrup and turning demands survive display through HumanPerformance.
 *
 * Scenarios:
 *
 * 1. Opposite canter leads change the sign of the displayed pelvic bank at the
 *    same fraction of their respective leading-fore touchdown clocks. The
 *    pelvis returns to its touchdown orientation at the next touchdown.
 * 2. On an authored moving support, the rider lifts off the seat during the jump,
 *    keeps both foot balls on the stirrups and settles back on recovery. A ride
 *    with the takeoff and landing cues exchanged is refused.
 * 3. At an over-shoulder cue the face enters the rear hemisphere of the horse
 *    while the horse travels forward and the pelvis faces with the saddle. The
 *    face returns forward when the cue window ends.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the support, cue clocks, displayed coordinates, three cases and the rejected cue order.
 * @evidence contracts/development/testing.md#behavioral-verification Read displayed pelvis and head frames and sole points from the performance. Sample independently published tack frames and seat windows. A rider carried rigidly, a lost stirrup or a turn of the whole carrier cannot pass.
 * @evidence contracts/development/testing.md#independent-expectations The horse's named touchdowns supply the clock and the leading sides provide a mirror comparison. The legacy rider attachment test supplies the 10 mm contact bound. The sign of the carrier-relative forward direction distinguishes opposite hemispheres, and half a degree distinguishes a bank from numerical drift.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite leads, touchdown versus the middle of the stride, grounded versus airborne, a malformed jump and the cue's turnaround and boundaries. The jump fixture authors a carrier path; this does not verify an equine flight planner, a held prop, or the full interval between samples.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable memory-only scenario with one generated polygon man body, two canter courses and a refused schedule. No external renders or services.
 */
export function test_motion_mount_equestrian(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const left: ITrial = trial(body, "left");
  const right: ITrial = trial(body, "right");

  assertTakeClean("the left-lead exercise take", left.film);
  assertTakeClean("the right-lead exercise take", right.film);
  // 1. Compare displayed pelvis up in each saddle frame, starting at a real touchdown.
  const banks: number[] = [];
  for (const run of [left, right]) {
    const [from, to]: readonly [number, number] = run.stride;
    const before: IAutoMovieVector3 = axis(run, from, "hips", UP);
    const during: IAutoMovieVector3 = axis(
      run,
      from + (to - from) / 3,
      "hips",
      UP,
    );
    banks.push(during.x - before.x);
    TestValidator.predicate("pelvis returns at the next leading hoof", () =>
      vclose(axis(run, to, "hips", UP), before, 0.001),
    );
  }
  const minimumBank: number = Math.sin((0.5 * Math.PI) / 180);
  TestValidator.predicate(
    "opposite leads bank the pelvis to opposite sides",
    () =>
      Math.abs(banks[0]!) > minimumBank &&
      Math.abs(banks[1]!) > minimumBank &&
      banks[0]! * banks[1]! < 0,
  );

  // 2. Read the actual seat and soles as the carrier moves through the jump.
  const rider: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    left.film,
    "rider",
    body,
    0,
  );
  const seat = (at: number): IAutoMovieVector3 =>
    local(left.part("seat", at), HumanSignature.region(rider, "seat", at));
  const ball = (side: AutoMovieHumanSide, at: number): IAutoMovieVector3 =>
    local(
      left.part(`${side}Stirrup`, at),
      HumanFoot.sockets(body, HumanSignature.bones(rider, at), side).find(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.socket === "ball",
      )!.point,
    );
  const airborne: IAutoMovieVector3 = seat(FLIGHT);
  const seated: IAutoMovieVector3 = seat(APPROACH);
  TestValidator.predicate(
    "the moving horse and rider leave the start height and the rider clears his seat",
    () =>
      left.film.prop("horse", FLIGHT).position.y >
        left.film.prop("horse", TAKEOFF).position.y + CONTACT &&
      airborne.y > seated.y + CONTACT,
  );
  for (const side of ["left", "right"] as const) {
    const placed: IAutoMovieVector3 = ball(side, APPROACH);
    for (const at of [TAKEOFF, FLIGHT, LANDING, RECOVERY])
      TestValidator.predicate(`${side} sole keeps the stirrup at ${at}`, () =>
        nclose(Vector3.distance(ball(side, at), placed), 0, CONTACT),
      );
  }
  TestValidator.predicate("seat returns at recovery", () =>
    nclose(Vector3.distance(seat(RECOVERY), seated), 0, CONTACT),
  );
  const span: IAutoMovieMotionHumanSegment = left.film.segments("rider")[1]!;
  const seats: readonly IAutoMovieMotionHumanContactWindow[] =
    span.plan.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === "seat",
    );
  TestValidator.predicate(
    "the seat contact leaves and returns",
    () =>
      seats.length === 2 &&
      nclose(span.start + seats[0]!.to * span.plan.duration, APPROACH) &&
      nclose(span.start + seats[1]!.from * span.plan.duration, RECOVERY),
  );
  TestValidator.predicate("jump landmarks replay after later samples", () =>
    vclose(seat(FLIGHT), airborne),
  );
  let bad: unknown;
  try {
    trial(body, "left", true);
  } catch (error) {
    bad = error;
  }
  TestValidator.predicate(
    "reversed liftoff and touchdown are refused",
    () =>
      bad instanceof HumanRefusal &&
      bad.kind === "parameter" &&
      bad.axis === "equestrian.jump",
  );

  // 3. Compare the displayed head and pelvis in the forward-moving saddle's frame.
  TestValidator.predicate(
    "the rearward face and forward pelvis coexist while the horse advances",
    () =>
      axis(left, LOOK - 0.5, "head", FORWARD).z > 0 &&
      axis(left, LOOK, "head", FORWARD).z < 0 &&
      axis(left, LOOK, "hips", FORWARD).z > 0 &&
      axis(left, LOOK + 0.5, "head", FORWARD).z > 0 &&
      left.part("seat", LOOK + 0.5).translation.z >
        left.part("seat", LOOK - 0.5).translation.z,
  );
}

/** The two neutral axes read through the displayed body and the saddle. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** A displayed bone's axis resolved in the saddle's own axes. */
function axis(
  run: ITrial,
  at: number,
  bone: AutoMovieHumanoidBone,
  vector: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.multiply(
      Quaternion.inverse(run.part("seat", at).rotation),
      run.film.bones("rider", at).get(bone)!.worldRotation,
    ),
    vector,
  );
}

/** A world point measured against the published tack frame. */
function local(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}

/**
 * Prepare a real canter, with an authored vertical carrier path in the jumping
 * case.
 */
function trial(
  body: IAutoMovieMotionHumanBody,
  lead: AutoMovieHumanSide,
  reversed: boolean = false,
): ITrial {
  const horse: ReturnType<typeof createHorse> = createHorse({});
  const speed: number = 5.5 * Math.sqrt(horse.dimensions.withersHeight! / 1.38);
  const canter: ReturnType<typeof rideHorse> = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: speed * 7, gait: "canter", lead }],
    cruise: speed,
    startSpeed: speed,
    endSpeed: speed,
  });
  const height = (at: number): number =>
    lead !== "left" || at <= TAKEOFF || at >= LANDING
      ? 0
      : 0.3 * Math.sin((Math.PI * (at - TAKEOFF)) / (LANDING - TAKEOFF)) ** 2;
  const filmToHorse = (at: number): number => Math.max(0, at - WAIT);
  const place = (at: number): IAutoMovieRigidTransform => {
    const base: IAutoMovieTransform = canter.at(filmToHorse(at)).placement;
    return {
      position: { ...base.translation, y: base.translation.y + height(at) },
      rotation: base.rotation,
    };
  };
  const part = (id: string, at: number): IAutoMovieTransform => {
    const base: IAutoMovieTransform = canter.frame(
      id as Parameters<typeof canter.frame>[0],
      filmToHorse(at),
    );
    return {
      ...base,
      translation: { ...base.translation, y: base.translation.y + height(at) },
    };
  };
  const cue = (
    name: string,
    seconds: number,
  ): { name: string; seconds: number } => ({ name, seconds });
  const strides: readonly { name: string; seconds: number }[] = canter.instants
    .filter((event): boolean => event.label === `${lead}ForeOn`)
    .map((event) => cue(event.label, WAIT + event.seconds))
    .filter((event): boolean => event.seconds > WAIT + 0.1)
    .slice(0, 2);
  if (strides.length !== 2 || strides[1]!.seconds >= LOOK - 0.5)
    throw new Error("Two leading hoof touchdowns must precede the film turn.");

  const saddle: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    horse,
    place(0),
  );
  const equestrian: NonNullable<
    IAutoMovieMotionHumanRide.IParams["equestrian"]
  > = {
    stride: { cue: "stride", gait: "canter", lead },
    ...(lead === "right"
      ? {}
      : {
          jump: {
            approach: "approach",
            takeoff: reversed ? "landing" : "takeoff",
            landing: reversed ? "takeoff" : "landing",
            recovery: "recovery",
          },
          lookBack: { cue: "look", side: "left", duration: 1 },
        }),
  };
  const film: HumanPerformance = new HumanPerformance({
    seed: "equestrian",
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    cues: {
      stride: strides,
      approach: [cue("approach", APPROACH)],
      takeoff: [cue("takeoff", TAKEOFF)],
      landing: [cue("landing", LANDING)],
      recovery: [cue("recovery", RECOVERY)],
      look: [cue("look", LOOK)],
    },
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
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
        duration: WAIT + canter.duration,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        equestrian,
      }).node,
  });
  return { film, part, stride: [strides[0]!.seconds, strides[1]!.seconds] };
}
