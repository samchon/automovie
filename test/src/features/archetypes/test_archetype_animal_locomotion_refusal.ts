import {
  type ArchetypeRide,
  type QuadrupedBody,
  type QuadrupedGait,
  QuadrupedLocomotion,
  createCamel,
  createDeer,
  createDog,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";

/**
 * Missing or malformed author clocks and unsupported gaits refuse explicitly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names required SI fields, missing/nonfinite/zero/negative clocks, equal-period support, sparse/empty/unsorted rows, malformed tables and unsupported actual consumers.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both public builders, table admission and the actual four-argument ride, requiring ArchetypeRefusal with actionable parameter axes rather than accepting arbitrary exceptions.
 * @evidence contracts/development/testing.md#independent-expectations Required positive finite SI quantities, positive swing after stance, strict speed order, closed gait choices and 0≤phase<1 with LF zero are the API contract; each invalid input violates one stated requirement without reading implementation outputs as expected values.
 * @evidence contracts/development/testing.md#distinguishing-cases Each of four required clock fields is missing or takes NaN, infinities, zero and negative values; exact support/period boundaries, empty/sparse/duplicate/descending rows, both-gaits-absent and missing/default-unsupported gaits are distinguished from a valid authored pace.
 * @evidence contracts/development/testing.md#execution-ownership Portable synchronous calls and finite literal records only; malformed values are explicit unchecked inputs, with no registry mutation, monkeypatch, renderer or process.
 */
export function test_archetype_animal_locomotion_refusal(): void {
  const findings: string[] = [];
  const clock: QuadrupedLocomotion.IClock = {
    speed: 3,
    stride: 1,
    foreStance: 0.45,
    hindStance: 0.35,
  };
  for (const field of [
    "speed",
    "stride",
    "foreStance",
    "hindStance",
  ] as const) {
    const missing: Partial<QuadrupedLocomotion.IClock> = { ...clock };
    delete missing[field];
    fixture.refused(findings, `missing ${field}`, (): unknown =>
      QuadrupedLocomotion.camel({
        pace: [missing as QuadrupedLocomotion.IClock],
      }),
    );
    for (const bad of [NaN, Infinity, -Infinity, 0, -1])
      fixture.refused(findings, `${field}=${bad}`, (): unknown =>
        QuadrupedLocomotion.camel({ pace: [{ ...clock, [field]: bad }] }),
      );
  }
  for (const field of ["foreStance", "hindStance"] as const)
    for (const duration of [1, 1 + Number.EPSILON])
      fixture.refused(findings, `${field} reaches period`, (): unknown =>
        QuadrupedLocomotion.camel({ pace: [{ ...clock, [field]: duration }] }),
      );
  const almostFull: QuadrupedGait.ITable = QuadrupedLocomotion.camel({
    pace: [{ ...clock, foreStance: 1 - Number.EPSILON }],
  });
  fixture.near(
    findings,
    "a positive swing immediately below the boundary remains valid",
    almostFull.gaits.pace!.rows[0]!.stance,
    1 - Number.EPSILON,
    0,
  );
  const sparse: QuadrupedLocomotion.IClock[] =
    new Array<QuadrupedLocomotion.IClock>(1);
  for (const rows of [
    [],
    sparse,
    [clock, clock],
    [clock, { ...clock, speed: 2 }],
  ])
    fixture.refused(
      findings,
      "empty/sparse/duplicate/descending rows",
      (): unknown => QuadrupedLocomotion.camel({ pace: rows }),
    );
  fixture.refused(findings, "missing camel clock", (): unknown =>
    QuadrupedLocomotion.camel({} as QuadrupedLocomotion.ICamel),
  );
  fixture.refused(findings, "missing deer gait", (): unknown =>
    QuadrupedLocomotion.deer({} as QuadrupedLocomotion.IDeer),
  );
  fixture.refused(findings, "descending deer gait ranges", (): unknown =>
    QuadrupedLocomotion.deer({
      trot: [{ ...clock, speed: 5 }],
      gallop: [{ ...clock, speed: 4 }],
    }),
  );
  const edits: readonly (readonly [
    string,
    (table: QuadrupedGait.ITable) => void,
  ])[] = [
    [
      "reference",
      (table: QuadrupedGait.ITable): void => {
        table.reference = NaN;
      },
    ],
    [
      "hysteresis",
      (table: QuadrupedGait.ITable): void => {
        table.hysteresis = -1;
      },
    ],
    [
      "follow",
      (table: QuadrupedGait.ITable): void => {
        table.follow = { fore: 1.1, hind: 0 };
      },
    ],
    [
      "empty order",
      (table: QuadrupedGait.ITable): void => {
        table.order = [];
      },
    ],
    [
      "duplicate gait",
      (table: QuadrupedGait.ITable): void => {
        table.order = ["walk", "pace", "pace"];
      },
    ],
    [
      "missing gait",
      (table: QuadrupedGait.ITable): void => {
        table.gaits = { walk: table.gaits.walk! };
      },
    ],
    [
      "zero frame",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.phases = {
          leftFore: 0.1,
          rightFore: 0.5,
          leftHind: 0,
          rightHind: 0.5,
        };
      },
    ],
    [
      "phase endpoint",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.phases = {
          leftFore: 0,
          rightFore: 1,
          leftHind: 0,
          rightHind: 0.5,
        };
      },
    ],
    [
      "negative phase",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.phases = {
          leftFore: 0,
          rightFore: -0.1,
          leftHind: 0,
          rightHind: 0.5,
        };
      },
    ],
    [
      "nonfinite phase",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.phases = {
          leftFore: 0,
          rightFore: NaN,
          leftHind: 0,
          rightHind: 0.5,
        };
      },
    ],
    [
      "period spread",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.rows[0]!.deviation = 1;
      },
    ],
    [
      "sparse table row",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.rows = new Array<QuadrupedGait.IRow>(1);
      },
    ],
    [
      "nonfinite bob",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.bob = NaN;
      },
    ],
    [
      "negative lift",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.lift = { fore: -1, hind: 0 };
      },
    ],
    [
      "nonfinite transition",
      (table: QuadrupedGait.ITable): void => {
        table.gaits.pace!.change = { kind: "speed", speed: Infinity };
      },
    ],
    [
      "missing transition",
      (table: QuadrupedGait.ITable): void => {
        delete table.gaits.pace!.change;
      },
    ],
  ];
  for (const [label, edit] of edits) {
    const table: QuadrupedGait.ITable = QuadrupedLocomotion.camel({
      pace: [clock],
    });
    edit(table);
    fixture.refused(findings, `table ${label}`, (): unknown =>
      QuadrupedLocomotion.admit(table),
    );
  }
  const animal: fixture.Animal = createCamel(
    { ...createCamel.REFERENCE, tempo: 0 },
    73,
  );
  const valid: QuadrupedGait.ITable = QuadrupedLocomotion.camel({
    pace: [clock],
  });
  fixture.refused(
    findings,
    "auto camel cannot use its walk above 1.08 m/s",
    (): unknown => rideQuadruped(animal, fixture.course(3)),
  );
  const dog: ReturnType<typeof createDog> = createDog(
    { mass: 22, tempo: 0 },
    73,
  );
  fixture.refused(
    findings,
    "auto dog cannot fill the .9–2.69 m/s gap",
    (): unknown => rideQuadruped(dog, fixture.course(1.5)),
  );
  fixture.refused(
    findings,
    "an explicit speed mark cannot hide an unobserved auto gap",
    (): unknown =>
      rideQuadruped(dog, {
        start: { x: 0, z: 0, heading: 0 },
        legs: [
          { kind: "straight", length: 6 },
          { kind: "straight", length: 6 },
        ],
        cruise: 2.69,
        startSpeed: 0.75,
        speeds: [1.5, 0],
        acceleration: 1,
        deceleration: 1,
      }),
  );
  fixture.refused(
    findings,
    "named gait cannot hide a faster leg",
    (): unknown =>
      rideQuadruped(dog, {
        ...fixture.course(1.5),
        legs: [{ kind: "straight", length: 9, gait: "walk" }],
      }),
  );
  const departing: ArchetypeRide.IRide<
    createDog.Affordance,
    QuadrupedBody.Dimension
  > = rideQuadruped(
    dog,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 6 }],
      cruise: 0.75,
      acceleration: 1,
      deceleration: 1,
    },
    "walk",
  );
  if (
    !Number.isFinite(departing.at(0.137).placement.translation.y) ||
    !Number.isFinite(
      departing.at(departing.duration - 0.137).placement.translation.y,
    )
  )
    findings.push(
      "genuine zero-speed departure/arrival lost their shortened minimum-speed steps",
    );
  fixture.refused(
    findings,
    "default camel pace remains unsupported",
    (): unknown => rideQuadruped(animal, fixture.course(3), "pace"),
  );
  fixture.refused(findings, "camel authored canter absent", (): unknown =>
    rideQuadruped(animal, fixture.course(3), "canter", valid),
  );
  valid.gaits.pace!.rows[0]!.stride = NaN;
  fixture.refused(findings, "fourth argument is admitted", (): unknown =>
    rideQuadruped(animal, fixture.course(3), "pace", valid),
  );
  const deer: fixture.Animal = createDeer({ tempo: 0 }, 73);
  const gallopOnly: QuadrupedGait.ITable = QuadrupedLocomotion.deer({
    gallop: [{ ...clock, speed: 4 }],
  });
  const trotOnly: QuadrupedGait.ITable = QuadrupedLocomotion.deer({
    trot: [{ ...clock, speed: 2 }],
  });
  fixture.refused(
    findings,
    "default deer gallop remains unsupported",
    (): unknown => rideQuadruped(deer, fixture.course(4), "gallop"),
  );
  fixture.refused(findings, "gallop-only has no authored trot", (): unknown =>
    rideQuadruped(deer, fixture.course(2), "trot", gallopOnly),
  );
  fixture.refused(findings, "trot-only has no authored gallop", (): unknown =>
    rideQuadruped(deer, fixture.course(4), "gallop", trotOnly),
  );
  TestValidator.equals(
    "authored locomotion rejects incomplete and malformed requests",
    findings,
    [],
  );
}
