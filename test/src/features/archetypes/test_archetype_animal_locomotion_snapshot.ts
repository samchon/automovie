import {
  HorseGait,
  type QuadrupedBody,
  QuadrupedChange,
  QuadrupedGait,
  QuadrupedLocomotion,
  createCamel,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";

/**
 * Prepared rides isolate their authored input clocks, tables and returned poses.
 *
 * Scenarios:
 * 1. Canonical horse canter [4, 8.5] and gallop [5, 8] m/s survive table
 *    admission unchanged, including their 6.5 m/s overlap transition.
 * 2. Prepared camel rides retain their clocks and poses after caller mutation
 *    and reordered seeking, while the original measured walk remains unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes nested measured gait ranges, their preserved transition, clock/table mutation after preparation, mutation of a returned foot/root pose, out-of-order replay and the unchanged measured default walking period.
 * @evidence contracts/development/testing.md#behavioral-verification Admits the complete measured horse table and reads its actual gait ranges and transition, then checks row ownership by mutation. Prepares an actual camel ride, mutates the original clock and builder-result table and an emitted posed endpoint, then repeats real sampling and footfall observations; no fake sampler or registry replacement is installed.
 * @evidence contracts/development/testing.md#independent-expectations The horse's source-table canter [4,8.5] and gallop [5,8] m/s are restated literals; their intersection [5,8] has midpoint6.5. Referential transparency requires identical geometry for identical prepared inputs regardless of later caller mutations or query order. The authored 1 s cycle and Catavitello 2018's independent 1.7333333333333336 s camel walk distinguish override isolation from registry leakage; before/after observations test invariance rather than serve as a physical-motion oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Nested canter/gallop speed ranges remain distinct from ordered nonoverlapping authored clocks. Separately mutates required input seconds, table rows/phases/pose/follow/reference/order and a returned moved-part/root transform, then samples earlier and later times and checks the default species still lacks pace.
 * @evidence contracts/development/testing.md#execution-ownership One portable in-memory scenario owns every mutable record; mutation targets caller-owned inputs and returned sample records, with no method patch, global mutation, host or rendering.
 */
export function test_archetype_animal_locomotion_snapshot(): void {
  const findings: string[] = [];
  const originalHorse: string = JSON.stringify(HorseGait.TABLE);
  const admittedHorse: QuadrupedGait.ITable = QuadrupedLocomotion.admit(
    HorseGait.TABLE,
  );
  const horse: createQuadruped.ISpecies = {
    ...createQuadruped.SPECIES.horse,
    table: admittedHorse,
  };
  for (const [gait, minimum, maximum] of [
    ["canter", 4, 8.5],
    ["gallop", 5, 8],
  ] as const) {
    const range: { minimum: number; maximum: number } = QuadrupedGait.range(
      horse,
      gait,
    );
    fixture.near(
      findings,
      `${gait} retains its source minimum`,
      range.minimum,
      minimum,
      0,
    );
    fixture.near(
      findings,
      `${gait} retains its source maximum`,
      range.maximum,
      maximum,
      0,
    );
  }
  fixture.near(
    findings,
    "nested measured gait ranges retain their actual overlap midpoint",
    QuadrupedChange.point(
      horse,
      "canter",
      "gallop",
      { withersHeight: admittedHorse.reference },
      0,
    ),
    6.5,
    0,
  );
  admittedHorse.gaits.gallop!.rows[0]!.speed = 6;
  if (JSON.stringify(HorseGait.TABLE) !== originalHorse)
    findings.push("admitted horse rows share mutable measured source records");

  const animal: fixture.Animal = createCamel(
    {
      ...createCamel.REFERENCE,
      tempo: 0,
      lead: {
        width: 0.02,
        thickness: 0.003,
        leadLength: 0.6,
        leadRadius: 0.004,
      },
    },
    73,
  );
  const clock: QuadrupedLocomotion.IClock = {
    speed: 3,
    stride: 1,
    foreStance: 0.45,
    hindStance: 0.35,
  };
  const table: QuadrupedGait.ITable = QuadrupedLocomotion.camel({
    pace: [clock],
  });
  const ride: fixture.Ride = rideQuadruped(
    animal,
    fixture.course(3),
    "pace",
    table,
  );
  const observe: () => string = (): string =>
    JSON.stringify(
      [1.231, 2.137, 3.271].map((seconds: number): unknown => ({
        placement: ride.at(seconds).placement,
        fixed: ride
          .at(seconds)
          .archetype.parts.filter(
            (part: IAutoMovieModelPart): boolean =>
              part.id === "trunk" || part.id === "hump",
          )
          .map((part: IAutoMovieModelPart): unknown => ({
            id: part.id,
            transform: part.transform,
          })),
        contact: ride.at(seconds).archetype.affordance("lead").frame,
        feet: fixture.FEET.map(
          (limb: QuadrupedBody.Limb): IAutoMovieVector3 =>
            fixture.foot(ride, limb, seconds),
        ),
      })),
    );
  const before: string = observe();
  const sourceBefore: string = JSON.stringify({
    parts: animal.parts,
    contacts: animal.affordances,
  });
  clock.stride = 9;
  clock.hindStance = 4;
  fixture.near(
    findings,
    "builder snapshot retains authored input period",
    table.gaits.pace!.rows[0]!.stride,
    1,
    0,
  );
  fixture.near(
    findings,
    "builder snapshot retains authored hind stance",
    table.gaits.pace!.rows[0]!.hindStance!,
    0.35,
    0,
  );
  table.gaits.pace!.rows[0]!.stride = 7;
  table.gaits.pace!.rows[0]!.stance = 2;
  table.gaits.pace!.rows[0]!.hindStance = 3;
  table.gaits.pace!.phases = {
    leftFore: 0,
    rightFore: 0.25,
    leftHind: 0.5,
    rightHind: 0.75,
  };
  table.gaits.pace!.bob = 0.9;
  table.gaits.pace!.lift = { fore: 0.7, hind: 0.8 };
  table.gaits.pace!.fold = { fore: 5, hind: 6 };
  table.follow = { fore: 0.8, hind: 0.9 };
  table.reference = 99;
  table.order = ["walk"];
  const published: ReturnType<typeof ride.at> = ride.at(2.137);
  const moved: IAutoMovieModelPart = published.archetype.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "leftForePastern",
  )!;
  moved.transform!.translation.x += 100;
  const fixed: IAutoMovieModelPart = published.archetype.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "trunk",
  )!;
  fixed.transform!.translation.x += 101;
  fixed.transform!.rotation.y += 0.3;
  fixed.transform!.scale.z += 0.4;
  fixed.id = "caller-mutated-trunk";
  const frame: ReturnType<typeof animal.affordance>["frame"] =
    published.archetype.affordance("lead").frame;
  frame.translation.x += 102;
  frame.rotation.z += 0.3;
  frame.scale.y += 0.4;
  published.placement.translation.y -= 100;
  ride.at(4.319);
  ride.at(0.137);
  if (observe() !== before)
    findings.push(
      "a prepared ride retained mutable caller clocks/table or returned transforms",
    );
  if (
    JSON.stringify({ parts: animal.parts, contacts: animal.affordances }) !==
    sourceBefore
  )
    findings.push(
      "a returned fixed part/contact frame mutation reached the source model",
    );
  const landings: number[] = ride.instants
    .filter(
      (instant: { seconds: number; label: string }): boolean =>
        instant.label === "leftForeOn",
    )
    .map((instant: { seconds: number }): number => instant.seconds);
  fixture.near(
    findings,
    "prepared authored period survives mutation",
    landings[2]! - landings[1]!,
    1,
    1e-9,
  );
  const original: fixture.Ride = rideQuadruped(
    animal,
    fixture.course(1.08),
    "walk",
  );
  const walking: number[] = original.instants
    .filter(
      (instant: { seconds: number; label: string }): boolean =>
        instant.label === "leftForeOn",
    )
    .map((instant: { seconds: number }): number => instant.seconds);
  fixture.near(
    findings,
    "registered walking clock remains measured",
    walking[2]! - walking[1]!,
    1.7333333333333336,
    1e-9,
  );
  fixture.refused(
    findings,
    "the registry still has no default pace",
    (): unknown => rideQuadruped(animal, fixture.course(3), "pace"),
  );
  TestValidator.equals(
    "prepared authored locomotion is isolated and replayable",
    findings,
    [],
  );
}
