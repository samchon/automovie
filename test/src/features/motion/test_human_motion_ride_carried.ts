import { createCar, driveCar } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanRide,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A rider is carried by what they sit on: seated in a car that drives off
 * and turns, the body stays on its seat and faces where the car faces,
 * while the hands stay free for other actions.
 *
 * A person in a moving car does not slide on the seat. So in the car's own
 * frame the rider's seat keeps its place for the whole ride, whatever the
 * car does in the world, and the rider's heading is the car's.
 *
 * Scenarios, the average man in a mid-band sedan that waits 3 s, drives
 * 10 m straight and turns 90 degrees on an 8 m radius:
 * 1. Sitting on the driver's seat and riding for the drive's length plans.
 * 2. At nine instants of the ride, the place of the body's seat region
 *    relative to the seat (its distance from the seat's front edge, a
 *    rigid offset) stays within 10 mm of what it was when the ride began.
 * 3. At those instants the rider faces within 1 degree of the seat's
 *    heading, which turns 90 degrees over the ride.
 * 4. A phone call performed over the ride plans: the ride yields the arms.
 * 5. Riding without sitting on the support first is refused as a `base`
 *    refusal that offers sitting.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives a real archetype, gives it to the performance as a moving prop and reads the rider's displayed seat region and heading through the ride; a rider left behind, sliding on the seat or facing the old way fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the seat is at each instant is the archetype ride's own placement of the car; that a seated rider does not slide is what being carried means. The 10 mm is the campaign's support bound.
 * @evidence contracts/development/testing.md#distinguishing-cases A straight leg and a turn, an overlay on the ride, and a ride entered from the wrong base.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype ride; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_ride_carried(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const car = createCar({ kind: "sedan" });
  const drive = driveCar(car, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 10 },
      { kind: "turn", radius: 8, angle: 90 },
    ],
    cruise: 6,
    acceleration: 2,
    deceleration: 3,
  });
  const WAIT: number = 3;

  // The car stands for the first seconds, while the driver sits down.
  const placed = (seconds: number): IHumanProp.IFrame => {
    const sample = drive.at(Math.max(0, seconds - WAIT));
    return {
      position: sample.placement.translation,
      rotation: sample.placement.rotation,
    };
  };
  const seat = HumanObject.seat(car, placed(0), "driverSeat");
  const radians: number = (seat.yaw * Math.PI) / 180;
  const perform = (chain: HumanChain): HumanPerformance =>
    new HumanPerformance({
      seed: "ride",
      laws: [HumanRide.ride],
      props: [HumanObject.prop("car", car, placed(0), placed)],
      performers: [
        {
          subject: "a",
          body,

          // The ankles 0.2 m ahead of the seat's front edge, back to it.
          at: {
            x: seat.at.x + 0.2 * Math.sin(radians),
            y: 0,
            z: seat.at.z + 0.2 * Math.cos(radians),
          },
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const complaints: string[] = [];
  const riding = (): HumanChain =>
    HumanChain.subject("a")
      .sit({ seat })
      .registered("ride", { on: "car", seconds: drive.duration });

  // 1 to 3. Carried on the seat, facing the car's way.
  const performance: HumanPerformance = perform(riding());
  const ride = performance.segments("a")[1]!;
  const reader: HumanSignature.IReader = HumanSignature.of(
    performance,
    "a",
    body,
    0,
  );
  const offset = (seconds: number): number => {
    const now = HumanObject.seat(car, placed(seconds), "driverSeat");
    const rests: IAutoMovieVector3 = HumanSignature.region(
      reader,
      "seat",
      seconds,
    );
    return Math.hypot(
      rests.x - now.at.x,
      rests.y - now.at.y,
      rests.z - now.at.z,
    );
  };
  const first: number = offset(ride.entryTime);
  let turned: number = 0;
  for (let k: number = 0; k <= 8; ++k) {
    const seconds: number =
      ride.entryTime + (k / 8) * (ride.end - ride.entryTime);
    const slid: number = Math.abs(offset(seconds) - first);
    if (slid > 0.01)
      complaints.push(
        `at ${seconds.toFixed(2)} s the rider's seat has moved ${(slid * 1000).toFixed(1)} mm on the car's seat, within 10 mm expected`,
      );
    const heading: number = HumanObject.seat(
      car,
      placed(seconds),
      "driverSeat",
    ).yaw;
    const faces: number = performance.posture("a", seconds).yaw;
    if (Math.abs(((faces - heading + 540) % 360) - 180) > 1)
      complaints.push(
        `at ${seconds.toFixed(2)} s the rider faces ${faces.toFixed(1)} degrees and the seat ${heading.toFixed(1)}`,
      );
    turned = Math.max(turned, Math.abs(heading - seat.yaw));
  }
  if (!(turned > 80))
    complaints.push(
      `the drive turns the seat ${turned.toFixed(0)} degrees, about 90 expected`,
    );

  // 4. The hands are free on the ride.
  try {
    perform(riding().over((o) => o.handToFace({ task: "phone" })));
  } catch (error) {
    complaints.push(
      `a phone call over the ride: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 5. A ride is entered seated.
  let thrown: unknown = null;
  try {
    perform(
      HumanChain.subject("a")
        .stand({ seconds: 0.5 })
        .registered("ride", { on: "car", seconds: 2 }),
    );
  } catch (error) {
    thrown = error;
  }
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "base" &&
      thrown.feasible?.kind === "alternatives" &&
      thrown.feasible.values.includes("sit")
    )
  )
    complaints.push(
      `riding from standing: expected a base refusal offering sit, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );

  TestValidator.equals("a rider is carried by the seat", complaints, []);
}
