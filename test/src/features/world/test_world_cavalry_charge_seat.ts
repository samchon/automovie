import {
  AutoMovieArchetypeCourse,
  type AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypeQuadrupedGait,
  createHorse,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A horse's timed ride. */
type Ride = ReturnType<typeof rideQuadruped<string, string>>;

/** Seconds the trooper takes to sit before the charge. */
const MOUNT: number = 4.5;

/** The rider attachment contract's 10 mm contact budget, metres. */
const CONTACT: number = 0.01;

/**
 * A trooper keeps the seat through the charge: the horse is cued from the
 * canter into the gallop on its timed charge course, and the rider stays seated
 * within the contact budget and passes the shipped verdicts.
 *
 * Scenarios:
 *
 * 1. Through the canter and the cued gallop, the rider's seat holds within the
 *    contact budget.
 * 2. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the charge course, the cue and the two scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Seats a real rider on a real cued gallop ride through `HumanPerformance` and reads the displayed hips against the saddle's seat.
 * @evidence contracts/development/testing.md#independent-expectations The contact budget is the rider attachment contract's 10 mm; the gallop's speed is the middle of the horse's declared gallop range.
 * @evidence contracts/development/testing.md#distinguishing-cases The canter before the cue and the gallop after it. The cue's timing is pinned by test_world_mounted_cues and a seated rider's envelope by test_world_mounted_rider_envelope.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec through the public performance path.
 */
export function test_world_cavalry_charge_seat(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    1028,
  );
  const species: ReturnType<typeof createQuadruped.species> =
    createQuadruped.species(horse);
  const canter: AutoMovieArchetypeManoeuvre.ISpeedRange =
    AutoMovieArchetypeQuadrupedGait.range(species, "canter", 1.65);
  const gallop: AutoMovieArchetypeManoeuvre.ISpeedRange =
    AutoMovieArchetypeQuadrupedGait.range(species, "gallop", 1.65);
  const cruise: number = (canter.minimum + canter.maximum) / 2;
  const charge: number = (gallop.minimum + gallop.maximum) / 2;
  const samples: AutoMovieArchetypeCourse.ISample[] = [];
  let z: number = 0;
  for (let i: number = 0; i <= 80; ++i) {
    const seconds: number = i * 0.1;
    samples.push({ seconds, x: 0, y: 0, z });
    z +=
      0.1 *
      (seconds < 3
        ? cruise
        : seconds < 4
          ? cruise + (charge - cruise) * (seconds - 3)
          : charge);
  }
  const ride: Ride = rideQuadruped(horse, {
    plan: AutoMovieArchetypeCourse.timed("charger", samples),
    cues: [
      { from: 0, to: 3, gait: "canter" },
      { from: 3, to: 8, gait: "gallop" },
    ],
  });
  const local: (at: number) => number = (at: number): number =>
    Math.max(0, Math.min(ride.duration, at - MOUNT));
  const place: (at: number) => IAutoMovieRigidTransform = (
    at: number,
  ): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(local(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part: (id: string, at: number) => IAutoMovieTransform = (
    id: string,
    at: number,
  ): IAutoMovieTransform =>
    ride.frame(id as Parameters<Ride["frame"]>[0], local(at));
  const saddle: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    ride.at(0).archetype,
    place(0),
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "charge-seat",
    performers: [
      {
        subject: "trooper",
        body,
        at: HumanFrame.point(
          { origin: { ...saddle.at, y: 0 }, yaw: saddle.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: saddle.yaw,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    props: [HumanObject.prop("charger", horse, place(0), place, part)],
    composition: HumanChain.subject("trooper")
      .sit({ seat: saddle, hold: 0.5 })
      .registered("ride", {
        on: "charger",
        duration: MOUNT + ride.duration,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
      }).node,
  });
  assertTakeClean("trooper through the charge", film);
  const offsets: number[] = Array.from(
    { length: 33 },
    (_: unknown, i: number): number => {
      const at: number = MOUNT + i * 0.25;
      return Vector3.distance(
        film.bones("trooper", at).get("hips")!.worldPosition,
        part("seat", at).translation,
      );
    },
  );
  TestValidator.predicate(
    `the trooper keeps the seat through the canter and the gallop: ${(Math.max(...offsets) - Math.min(...offsets)).toFixed(4)} m`,
    Math.max(...offsets) - Math.min(...offsets) <= CONTACT,
  );
}
