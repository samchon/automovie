import {
  type ArchetypeAssembly,
  type ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRide,
} from "@automovie/archetypes";
import type { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRide,
  HumanSignature,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeCarriage } from "../internal/archetypeCarriage";
import { motionHumanBody } from "../internal/motionHumanBody";
import { qclose, vclose } from "../internal/predicates";

/** The carriage's ids. */
type Id = ArchetypeAssembly.Ids<archetypeCarriage.Members>;

/**
 * An assembly rides a course as one object: every member's contacts keep their places on it, and a person seated on a member's seat is carried there.
 *
 * Scenarios, for the test carriage of three benches, two rails and a low wall, waiting 3 s, then driven 12 m straight and round a quarter turn of 15 m radius:
 * 1. At 13 seconds of the ride, every bench's seat and every rail's bar is, relative to the carriage's root, where the member's placement puts the member's own contact, within 1e-9 m and in rotation.
 * 2. A seated average man riding on `bench2/seat` with `HumanRide.ride` stays within 10 mm of where he sat on the seat at nine instants of the ride, and turns with it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Moves a real assembly with `ArchetypeRide.along` and hands it to a performance as a moving prop; a member left behind, a contact moved within the carriage, or a rider sliding off a member's seat is caught.
 * @evidence contracts/development/testing.md#independent-expectations Each contact's place on the root is composed here from the member's own contact and its placement; that a seated rider does not slide is what being carried means, and 10 mm is the campaign's held-contact bound (#3477).
 * @evidence contracts/development/testing.md#distinguishing-cases A straight and a turn, seats and bars of several members, a waiting start; the assembly's admission belongs to `test_archetype_assembly_valid` and its articulation to `test_archetype_assembly_articulate`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype ride; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_assembly_ride(): void {
  const findings: string[] = [];
  const members: archetypeCarriage.Members = archetypeCarriage.members(7);
  const carriage: ReturnType<typeof archetypeCarriage> = archetypeCarriage(7);
  const course: ArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 12 },
      { kind: "turn", radius: 15, angle: 90 },
    ],
    cruise: 3,
    acceleration: 1,
    deceleration: 1,
    at: 3,
  };
  const ride: ArchetypeRide.IRide<Id, never> = ArchetypeRide.along(carriage, course);

  // 1. Every member's contacts keep their places on the root.
  const contacts: readonly (readonly [string, IAutoMovieTransform, IAutoMovieTransform])[] = [
    ...(["bench1", "bench2", "bench3"] as const).map(
      (key: "bench1" | "bench2" | "bench3"): [string, IAutoMovieTransform, IAutoMovieTransform] => [
        `${key}/seat`,
        members[key].placement,
        members[key].archetype.affordance("seat").frame,
      ],
    ),
    ...(["railLeft", "railRight"] as const).map(
      (key: "railLeft" | "railRight"): [string, IAutoMovieTransform, IAutoMovieTransform] => [
        `${key}/bar`,
        members[key].placement,
        members[key].archetype.affordance("bar").frame,
      ],
    ),
  ];
  for (let k: number = 0; k <= 12; k++) {
    const seconds: number = (ride.duration * k) / 12;
    const root: IAutoMovieTransform = ride.at(seconds).placement;
    for (const [id, placement, own] of contacts) {
      const expected: IAutoMovieTransform = ArchetypeFrame.compose(
        root,
        ArchetypeFrame.compose(placement, own),
      );
      const got: IAutoMovieTransform = ride.frame(id as Id, seconds);
      if (
        !vclose(got.translation, expected.translation, 1e-9) ||
        !qclose(got.rotation, expected.rotation, 1e-12)
      )
        findings.push(`${id} at ${seconds} s`);
    }
  }

  // 2. A rider on a member's seat is carried with it.
  const body: IHumanBody = motionHumanBody("m-average");
  const placed = (seconds: number): IHumanProp.IFrame => {
    const sample: IAutoMovieTransform = ride.at(seconds).placement;
    return { position: sample.translation, rotation: sample.rotation };
  };
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    carriage,
    placed(0),
    "bench2/seat",
  );
  const radians: number = (seat.yaw * Math.PI) / 180;
  const performance: HumanPerformance = new HumanPerformance({
    seed: "carriage",
    laws: [HumanRide.ride],
    props: [HumanObject.prop("carriage", carriage, placed(0), placed)],
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
    composition: HumanChain.subject("a")
      .sit({ seat })
      .registered("ride", { on: "carriage", seconds: ride.duration }).node,
  });
  const segment: ReturnType<HumanPerformance["segments"]>[number] =
    performance.segments("a")[1]!;
  const reader: HumanSignature.IReader = HumanSignature.of(performance, "a", body, 0);
  const offset = (seconds: number): number => {
    const now: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
      carriage,
      placed(seconds),
      "bench2/seat",
    );
    const rests: IAutoMovieVector3 = HumanSignature.region(reader, "seat", seconds);
    return Math.hypot(rests.x - now.at.x, rests.y - now.at.y, rests.z - now.at.z);
  };
  const first: number = offset(segment.entryTime);
  for (let k: number = 0; k <= 8; k++) {
    const seconds: number =
      segment.entryTime + (k / 8) * (segment.end - segment.entryTime);
    const slid: number = Math.abs(offset(seconds) - first);
    if (slid > 0.01)
      findings.push(
        `at ${seconds.toFixed(2)} s the rider has slid ${(slid * 1000).toFixed(1)} mm on bench2's seat`,
      );
  }
  TestValidator.equals("an assembly rides as one object", findings, []);
}
