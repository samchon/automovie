import assert from "node:assert/strict";

import {
  AutoMovieArchetypeQuadrupedGait as Gait,
  AutoMovieArchetypeQuadrupedLocomotion as Locomotion,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";

/**
 * Admits finite gait clocks and refuses unrepresentable sampled timing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names nonfinite clock, phase and transition controls and the retained endpoint and subnormal-speed inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real table admission, authored camel route and timing reader. Checks field-specific refusals, both inclusive speed endpoints, the two duty ratios and finite signed exponent.
 * @evidence contracts/development/testing.md#independent-expectations The midpoint of periods 1 and 2 is 1.5. Fore and hind support of 0.625 and 0.875 yield 5/12 and 7/12. Adding 0.4 times MAX_VALUE to 0.8 times MAX_VALUE exceeds binary64 range, as does doubling the latter period. At tempo -1, the reduced period fits while the independently scaled spread overflows.
 */
export function test_archetypes_animals_quadruped_finite_clock(): void {
  const walk: Gait.IGait = {
    rows: [
      { speed: 2, stride: 1, deviation: 0.25, stance: 0.5 },
      { speed: 4, stride: 2, deviation: 0.5, stance: 0.75, hindStance: 1.25 },
    ],
    phases: { leftFore: 0, rightFore: 0.5, leftHind: 0.25, rightHind: 0.75 },
    bob: 0.1,
    nod: { range: 5, timing: "support" },
    fold: { fore: 15, hind: 20 },
    lift: { fore: 0.1, hind: 0.15 },
  };
  const table: Gait.ITable = {
    order: ["walk"],
    gaits: { walk },
    reference: 1,
    hysteresis: 0,
    follow: { fore: 0, hind: 0.25 },
  };
  const withWalk = (changes: Partial<Gait.IGait>): Gait.ITable => ({
    ...table,
    gaits: { walk: { ...walk, ...changes } },
  });
  const withRow = (changes: Partial<Gait.IRow>): Gait.ITable =>
    withWalk({ rows: [{ ...walk.rows[0]!, ...changes }, walk.rows[1]!] });
  const withExponent = (exponent: number): Gait.ITable => ({
    ...table,
    order: ["walk", "trot"],
    gaits: {
      walk,
      trot: {
        ...walk,
        rows: [{ speed: 5, stride: 1, deviation: 0.1, stance: 0.5 }],
        change: { kind: "mass", speed: 5, mass: 20, exponent },
      },
    },
  });
  for (const [axis, malformed] of [
    ["table.reference", { ...table, reference: Infinity }],
    ["table.hysteresis", { ...table, hysteresis: NaN }],
    ["table.follow.fore", { ...table, follow: { fore: NaN, hind: 0 } }],
    ["table.gaits.walk.rows[0].speed", withRow({ speed: Infinity })],
    ["table.gaits.walk.rows[0].stride", withRow({ stride: NaN })],
    ["table.gaits.walk.rows[0].stance", withRow({ stance: NaN })],
    ["table.gaits.walk.rows[0].hindStance", withRow({ hindStance: NaN })],
    ["table.gaits.walk.rows[0].deviation", withRow({ deviation: NaN })],
    [
      "table.gaits.walk.rows[0].frequency",
      withRow({ stride: 2 * Number.MIN_VALUE, stance: Number.MIN_VALUE, deviation: 0 }),
    ],
    ["table.gaits.walk.phases.rightFore", withWalk({ phases: { ...walk.phases, rightFore: NaN } })],
    ["table.gaits.walk.bob", withWalk({ bob: Infinity })],
    ["table.gaits.trot.change.exponent", withExponent(NaN)],
  ] as const)
    assert.throws(
      () => Locomotion.admit(malformed),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal && error.axis === axis,
    );
  assert.equal(
    Locomotion.admit(withRow({ speed: Number.MIN_VALUE })).gaits.walk!.rows[0]!.speed,
    Number.MIN_VALUE,
  );
  assert.deepEqual(Locomotion.admit(withExponent(-0.25)).gaits.trot!.change, {
    kind: "mass",
    speed: 5,
    mass: 20,
    exponent: -0.25,
  });

  const row: Locomotion.IClock = {
    speed: 3,
    stride: 1,
    foreStance: 0.3,
    hindStance: 0.4,
  };
  assert.throws(() => Locomotion.camel({ pace: [{ ...row, hindStance: NaN }] }), {
    name: "AutoMovieArchetypeRefusal",
    axis: "pace.rows[0].hindStance",
  });
  assert.deepEqual(Locomotion.camel({ pace: [row] }).gaits.pace!.rows[0], {
    speed: 3,
    stride: 1,
    deviation: 0,
    stance: 0.3,
    hindStance: 0.4,
  });

  const species: Gait.ClockSource = {
    archetype: "inspection",
    table: Locomotion.admit(table),
  };
  assert.throws(() => Gait.timing(species, "walk", Infinity, 0, Infinity), {
    name: "AutoMovieArchetypeRefusal",
    axis: "withers",
  });
  assert.throws(
    () =>
      Gait.timing(
        { ...species, table: { ...species.table, scaling: "absolute" } },
        "walk",
        3,
        0,
        Infinity,
      ),
    { name: "AutoMovieArchetypeRefusal", axis: "withers" },
  );
  assert.throws(() => Gait.timing(species, "walk", Infinity), {
    name: "AutoMovieArchetypeRefusal",
    axis: "speed",
  });
  for (const [tempo, height, spread, axis] of [
    [1, 1, 0.4, "stride"],
    [0, 4, 0, "stride"],
    [-1, 4, 0.6, "deviation"],
  ] as const) {
    const oversized: Gait.ClockSource = {
      ...species,
      table: Locomotion.admit(
        withWalk({
          rows: [{
            speed: 2,
            stride: 0.8 * Number.MAX_VALUE,
            stance: 1,
            deviation: spread * Number.MAX_VALUE,
          }],
        }),
      ),
    };
    assert.throws(
      () => Gait.timing(oversized, "walk", 2 * Math.sqrt(height), tempo, height),
      { name: "AutoMovieArchetypeRefusal", axis },
    );
  }
  assert.deepEqual(Gait.range(species, "walk"), { minimum: 2, maximum: 4 });
  assert.equal(Gait.timing(species, "walk", 2).stride, 1);
  assert.equal(Gait.timing(species, "walk", 4).stride, 2);
  assert.deepEqual(Gait.timing(species, "walk", 3, 1), {
    stride: 1.875,
    deviation: 0.375,
    duty: 5 / 12,
    hindDuty: 7 / 12,
  });
}
