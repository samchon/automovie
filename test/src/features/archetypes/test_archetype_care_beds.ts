import { AutoMovieArchetypeUnits, createBed } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/** Stryker GoBed II's litter range and outer size, and the IsoFlex mattress's 6 in. */
const GOBED: Readonly<{
  litter: readonly [number, number];
  mattress: number;
  length: number;
  width: number;
}> = {
  litter: [0.368, 0.737],
  mattress: 0.15,
  length: 2.394,
  width: 1.016,
};

/** IEC 60601-2-52's 220 mm of siderail over the mattress, as the supplier's guideline gives it. */
const SIDERAIL: number = 0.22;

/** 16 CFR 1508.3 and 1508.4: 26 in of rail over the support at its lowest, slats at most 2 3/8 in apart; DaVinci's 35 in from the front rail to the floor. */
const CRIB: Readonly<{
  rail: number;
  gap: number;
  top: readonly [number, number];
  width: readonly [number, number];
}> = {
  rail: 26 * AutoMovieArchetypeUnits.INCH,
  gap: 0.06,
  top: [35 * AutoMovieArchetypeUnits.INCH, 35 * AutoMovieArchetypeUnits.INCH],
  width: [
    (28 - 5 / 8) * AutoMovieArchetypeUnits.INCH,
    (28 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
  ],
};

/** IKEA MYDAL's 20 cm under the bed, 91 cm between the beds, 19 cm mattress at most, 206 x 97 x 157 cm frame; 16 CFR 1513.3's 5 in of guardrail over the mattress and 15 in opening. */
const MYDAL: Readonly<Record<string, number>> = {
  clearance: 0.2,
  gap: 0.91,
  thickest: 0.19,
  guard: 0.13,
  opening: 0.38,
  length: 2.06,
  width: 0.97,
  height: 1.57,
};

/**
 * A hospital bed, a crib and a bunk bed stand at their sources' heights and sizes, with their rails where the sources put them.
 *
 * Scenarios:
 * 1. A hospital bed's surface lies the IsoFlex mattress over a litter inside the GoBed II's range, its siderails' tops the 220 mm over the surface, and its outer size the sheet's.
 * 2. A crib's rail tops lie at DaVinci's 35 in, its mattress lies on a support the regulation's 26 in below them, its interior width inside the regulation's tolerance, and no two neighbouring slats stand more than 2 3/8 in apart.
 * 3. A bunk bed's lower surface lies its mattress over the maker's 20 cm, the upper the maker's 91 cm above it, its guardrails 5 in over the thickest mattress allowed, the climbing side's rail stopping 15 in short of the foot end, and its frame the maker's size.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contact frames over the seeds; a bed whose mattress, rail, support, slat or guardrail drifts from its source is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every expected value is the source's figure restated here (the GoBed II sheet, IEC 60601-2-52's 220 mm, 16 CFR 1508 and 1513, the IKEA MYDAL page), not read from the producer's bands.
 * @evidence contracts/development/testing.md#distinguishing-cases Three kinds with different rails: a panel siderail, slatted crib sides, and a guardrail with an opening; the shared bed rules belong to `test_archetype_furniture_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_care_beds(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The hospital bed.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "hospital bed surface height",
        measure: (seed: number): number =>
          createBed({ kind: "hospital" }, seed).affordance("surface").frame
            .translation.y,
        minimum: GOBED.litter[0] + GOBED.mattress,
        maximum: GOBED.litter[1] + GOBED.mattress,
        source: "Stryker GoBed II litter range and IsoFlex 6 in mattress",
      },
    ]),
  );
  const hospital: ReturnType<typeof createBed> = createBed(
    { kind: "hospital" },
    3,
  );
  const surface: number = hospital.affordance("surface").frame.translation.y;
  for (const id of ["leftRail", "rightRail"] as const)
    near(
      `the hospital bed's ${id} over the surface`,
      hospital.affordance(id).frame.translation.y - surface,
      SIDERAIL,
    );
  near(
    "the hospital bed's width with siderails up",
    archetypeExtent(hospital, "x").size,
    GOBED.width,
  );
  near(
    "the hospital bed's length",
    archetypeExtent(hospital, "z").size,
    GOBED.length,
  );

  // 2. The crib.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "crib rail top",
        measure: (seed: number): number =>
          archetypeExtent(createBed({ kind: "crib" }, seed), "y", ["rail-left"])
            .high,
        minimum: CRIB.top[0],
        maximum: CRIB.top[1],
        source: "DaVinci Kalani, front rail to floor 35 in",
      },
      {
        name: "crib interior width",
        measure: (seed: number): number =>
          createBed({ kind: "crib" }, seed).affordance("surface").width!,
        minimum: CRIB.width[0],
        maximum: CRIB.width[1],
        source: "16 CFR 1508.3(a)",
      },
    ]),
  );
  for (const seed of [0, 5, 11]) {
    const crib: ReturnType<typeof createBed> = createBed(
      { kind: "crib" },
      seed,
    );
    const top: number = archetypeExtent(crib, "y", ["rail-right"]).high;
    near(
      `crib ${seed}: the support under the rail tops`,
      top - archetypeExtent(crib, "y", ["mattress"]).low,
      CRIB.rail,
    );
    for (const [prefix, axis] of [
      ["slat-side-a-", "z"],
      ["slat-end-a-", "x"],
    ] as const) {
      const slats: { low: number; high: number }[] = crib
        .shapes()
        .filter((part: { id: string }): boolean => part.id.startsWith(prefix))
        .map((part: { id: string }): { low: number; high: number } =>
          archetypeExtent(crib, axis, [part.id]),
        )
        .sort(
          (a: { low: number }, b: { low: number }): number => a.low - b.low,
        );
      if (slats.length < 2)
        findings.push(`crib ${seed}: fewer than two ${prefix} slats`);
      for (let k: number = 1; k < slats.length; k++)
        if (!(slats[k]!.low - slats[k - 1]!.high <= CRIB.gap + 1e-9))
          findings.push(
            `crib ${seed}: ${prefix}${k} and ${prefix}${k + 1} stand ${slats[k]!.low - slats[k - 1]!.high} apart`,
          );
    }
  }

  // 3. The bunk bed.
  for (const seed of [0, 7, 19]) {
    const bunk: ReturnType<typeof createBed> = createBed(
      { kind: "bunk" },
      seed,
    );
    const thickness: number = bunk.dimensions.thickness!;
    const lower: number = bunk.affordance("surface").frame.translation.y;
    const upper: number = bunk.affordance("upper").frame.translation.y;
    near(`bunk ${seed}: the lower surface`, lower, MYDAL.clearance + thickness);
    near(`bunk ${seed}: between the beds`, upper - lower, MYDAL.gap);
    const guard: { low: number; high: number } = archetypeExtent(bunk, "y", [
      "guard-left",
    ]);
    near(
      `bunk ${seed}: the guardrail's top`,
      guard.high,
      upper - thickness + MYDAL.thickest + MYDAL.guard,
    );
    near(
      `bunk ${seed}: the opening at the climbing side's foot`,
      archetypeExtent(bunk, "z", ["guard-left"]).high -
        archetypeExtent(bunk, "z", ["guard-right"]).high,
      MYDAL.opening,
    );
    near(
      `bunk ${seed}: frame length`,
      archetypeExtent(bunk, "z").size,
      MYDAL.length,
    );
    near(
      `bunk ${seed}: frame width`,
      archetypeExtent(bunk, "x").size,
      MYDAL.width,
    );
    near(
      `bunk ${seed}: frame height`,
      archetypeExtent(bunk, "y").size,
      MYDAL.height,
    );
  }
  TestValidator.equals(
    "care and children's beds stand at their sources",
    findings,
    [],
  );
}
