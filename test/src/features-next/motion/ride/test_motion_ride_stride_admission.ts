import {
  type AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeQuadrupedLocomotion,
  createCamel,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../features/internal/throwsError";

/**
 * Gait clocks require ordered, representable speed samples and bounded phase enumeration.
 *
 * Scenarios:
 * 1. An empty or discontinuous set of rows, no swing time, or unrepresentable clock is refused.
 * 2. Exactly 2,000 cycles are accepted on a four-second course. Twice as many exceed its event budget.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks public clock and ride construction plus enumerated landings.
 * @evidence contracts/development/testing.md#independent-expectations Course length divided by speed and then stride yields the cycle count.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a finite small period from a nonrepresentable one.
 * @evidence contracts/development/testing.md#execution-ownership Uses one animal and one short analytic course.
 * @evidence contracts/development/common.md#meaningful-documentation Explains admissible clock and capacity boundaries.
 */
export function test_motion_ride_stride_admission(): void {
  const clock = (stride: number) => ({
    speed: 3,
    stride,
    foreStance: stride * 0.4,
    hindStance: stride * 0.3,
  });
  const regular = clock(1);
  for (const rows of [
    [],
    new Array<AutoMovieArchetypeQuadrupedLocomotion.IClock>(1),
    [regular, regular],
    [regular, { ...regular, speed: 2 }],
    [{ ...regular, foreStance: 1 }],
    [{ ...regular, hindStance: NaN }],
    [clock(1e-323)],
  ])
    TestValidator.predicate(
      "invalid stride rows",
      throwsError(() =>
        AutoMovieArchetypeQuadrupedLocomotion.camel({ pace: rows }),
      ),
    );
  const fast = AutoMovieArchetypeQuadrupedLocomotion.camel({
    pace: [clock(1e-9)],
  });
  TestValidator.equals(
    "a representable fast clock is accepted",
    fast.gaits.pace!.rows[0]!.stride,
    1e-9,
  );
  const camel = createCamel({ ...createCamel.REFERENCE, tempo: 0 }, 73);
  const course: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 12 }],
    cruise: 3,
    startSpeed: 3,
    endSpeed: 3,
  };
  const duration = 12 / 3,
    cycles = 2000;
  const prepare = (count: number) =>
    rideQuadruped(
      camel,
      course,
      "pace",
      AutoMovieArchetypeQuadrupedLocomotion.camel({
        pace: [clock(duration / count)],
      }),
    );
  const boundary = prepare(cycles);
  TestValidator.equals(
    "including its initial contact",
    boundary.instants.filter((e) => e.label === "leftForeOn").length,
    cycles + 1,
  );
  TestValidator.predicate(
    "twice the limit refuses",
    throwsError(() => prepare(2 * cycles)),
  );
  const edits: readonly (readonly [
    string,
    (table: AutoMovieArchetypeQuadrupedGait.ITable) => void,
  ])[] = [
    [
      "reference",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.reference = NaN;
      },
    ],
    [
      "hysteresis",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.hysteresis = -1;
      },
    ],
    [
      "follow",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.follow = { fore: 1.1, hind: 0 };
      },
    ],
    [
      "empty order",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.order = [];
      },
    ],
    [
      "duplicate gait",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.order = ["walk", "pace", "pace"];
      },
    ],
    [
      "missing gait",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.gaits = { walk: table.gaits.walk! };
      },
    ],
    [
      "zero frame",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
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
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
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
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
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
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
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
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.gaits.pace!.rows[0]!.deviation = 1;
      },
    ],
    [
      "sparse table row",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.gaits.pace!.rows =
          new Array<AutoMovieArchetypeQuadrupedGait.IRow>(1);
      },
    ],
    [
      "nonfinite bob",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.gaits.pace!.bob = NaN;
      },
    ],
    [
      "negative lift",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.gaits.pace!.lift = { fore: -1, hind: 0 };
      },
    ],
    [
      "nonfinite transition",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        table.gaits.pace!.change = { kind: "speed", speed: Infinity };
      },
    ],
    [
      "missing transition",
      (table: AutoMovieArchetypeQuadrupedGait.ITable): void => {
        delete table.gaits.pace!.change;
      },
    ],
  ];
  for (const [field, edit] of edits) {
    const candidate = AutoMovieArchetypeQuadrupedLocomotion.camel({
      pace: [regular],
    });
    edit(candidate);
    TestValidator.predicate(
      field,
      throwsError(() => AutoMovieArchetypeQuadrupedLocomotion.admit(candidate)),
    );
  }
}
