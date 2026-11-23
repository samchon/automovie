import {
  AutoMovieArchetypeCamelBody,
  AutoMovieArchetypeDeerBody,
  AutoMovieArchetypeRefusal,
  createCamel,
  createDeer,
  createQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { AnimalCohortObservation as observation } from "../internal/AnimalCohortObservation";

/**
 * Whole measured reference rows vary actual geometry without invented bands.
 *
 * Scenarios:
 * 1. Two hundred seeded camel/deer constructions each retain one complete
 *    source vector, repeat deterministically and match the public dispatcher.
 *    The five camel morphotypes and two adult deer references are all reached.
 * 2. Every explicit reference, both seedless defaults and the canonical fixed
 *    references reproduce their source geometry. Camel limb ratios retain the
 *    declared Egyptian-to-pooled-height transfer, not invented group osteometry.
 * 3. Bare female weight/skull/limbs use their matching cited rows; female
 *    antlers and unknown/juvenile references refuse. Authored lead equipment
 *    needs complete mass and cannot silently inherit a bare population mean.
 *    Explicit false removes male antlers; null mass is invalid rather than omitted.
 * 4. Explicit null/nonfinite/nonpositive body heights refuse in both species;
 *    only omission selects the current reference's measured height.
 *
 * Camel: Diop2020 TableII, printed p.250, doi:10.19182/remvt.31948;
 * all seven consumed traits below are the same group's centimetres in metres.
 * Group sizes, weights, probabilities and ranges are unknown. Deer: Ochiai
 * and Asada1995 Table3, p.225, adult body means; separately sampled same-sex
 * age5+ skulls/limbs are their1997 Tables3/7, pp.164/169. These are provisional
 * cross-sample control prototypes, not paired bodies or anatomical hard limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source tables, separate body/skeletal samples, SI conversions, fixed versus seeded cases, equipment mass and the limited meaning of discrete reference variation.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs real public models and registry outputs, reads actual displayed primitive landmarks and bar lengths, verifies source-axis provenance and exercises real actionable refusals.
 * @evidence contracts/development/testing.md#independent-expectations Literal whole rows are transcribed independently from primary tables. Actual primitive apex/circumference/axis endpoints supply geometric observations; the explicit limb transfer formula is the declared construction policy, not a measured morphotype bone claim. No constructor table is imported as an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all five seeded camel groups, both adult deer sexes, explicit pooled/male compatibility, seedless defaults, missing/invalid choices, female antler refusal, explicit antler absence, a constrained male antler request, explicit versus bare/omitted/null mass and null/nonfinite/nonpositive body heights; population frequencies and juvenile anatomy are not asserted.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous discoverable unit owns bounded200-seed loops, actual in-memory models and independent literal expectations. It starts no host, compiler, renderer, timer assertion or patched foreign method.
 */
export function test_archetype_animal_cohort_variation(): void {
  const references: Readonly<Record<string, observation.Expected>> = {
    "mauritanian-adult-female": {
      kind: "camel",
      height: 1.847,
      girth: 1.978,
      body: 1.471,
      head: 0.515,
      headWidth: 0.215,
      neck: 1.084,
      neckGirth: 0.656,
    },
    maur1: {
      kind: "camel",
      height: 1.893,
      girth: 2.008,
      body: 1.501,
      head: 0.528,
      headWidth: 0.219,
      neck: 1.108,
      neckGirth: 0.663,
    },
    maur2: {
      kind: "camel",
      height: 1.779,
      girth: 1.884,
      body: 1.431,
      head: 0.501,
      headWidth: 0.213,
      neck: 1.025,
      neckGirth: 0.658,
    },
    maur3: {
      kind: "camel",
      height: 1.871,
      girth: 1.947,
      body: 1.393,
      head: 0.509,
      headWidth: 0.207,
      neck: 1.09,
      neckGirth: 0.6236,
    },
    maur4: {
      kind: "camel",
      height: 1.766,
      girth: 2.054,
      body: 1.468,
      head: 0.508,
      headWidth: 0.216,
      neck: 1.066,
      neckGirth: 0.682,
    },
    maur5: {
      kind: "camel",
      height: 1.961,
      girth: 2.041,
      body: 1.678,
      head: 0.53,
      headWidth: 0.215,
      neck: 1.179,
      neckGirth: 0.643,
    },
    "boso-adult-male": {
      kind: "deer",
      height: 0.836,
      girth: 0.92,
      body: 0.882,
      head: 0.2669,
      headWidth: 0.1219,
      mass: 60.4,
      fore: [0.1995, 0.198, 0.1873],
      hind: [0.2396, 0.278, 0.2143],
      antlers: true,
    },
    "boso-adult-female": {
      kind: "deer",
      height: 0.74,
      girth: 0.788,
      body: 0.803,
      head: 0.2441,
      headWidth: 0.1037,
      mass: 39.5,
      fore: [0.1749, 0.1773, 0.1725],
      hind: [0.2141, 0.2424, 0.1981],
      antlers: false,
    },
  };
  const findings: string[] = [];
  const camelSeen: Set<string> = new Set();
  const deerSeen: Set<string> = new Set();
  for (let index: number = 0; index < 200; index++) {
    const seed: string = `whole-reference-${index}`;
    for (const kind of ["camel", "deer"] as const) {
      const actual: ReturnType<typeof createCamel> =
        kind === "camel"
          ? createCamel({ mass: 450 }, seed)
          : createDeer({}, seed);
      const key: string = actual.provenance.models.cohort!;
      const expected: observation.Expected | undefined = references[key];
      if (
        expected === undefined ||
        expected.kind !== kind ||
        (kind === "camel" && key === "mauritanian-adult-female")
      ) {
        findings.push(`${kind}/${seed}: unsupported seeded reference ${key}`);
        continue;
      }
      (kind === "camel" ? camelSeen : deerSeen).add(key);
      observation.observe(
        findings,
        `${kind}/${seed}/${key}`,
        actual,
        expected,
        kind === "camel" ? 450 : undefined,
      );
      const repeat: ReturnType<typeof createCamel> =
        kind === "camel"
          ? createCamel({ mass: 450 }, seed)
          : createDeer({}, seed);
      const dispatch: ReturnType<typeof createQuadruped> = createQuadruped(
        kind === "camel" ? { kind, mass: 450 } : { kind },
        seed,
      );
      const bytes: string = JSON.stringify({
        model: actual,
        dimensions: actual.dimensions,
        provenance: actual.provenance,
      });
      for (const other of [repeat, dispatch])
        if (
          JSON.stringify({
            model: other,
            dimensions: other.dimensions,
            provenance: other.provenance,
          }) !== bytes
        )
          findings.push(
            `${kind}/${seed}: repeat or registry changed a whole reference`,
          );
      if (kind === "deer" && actual.provenance.figures.mass !== "cohort")
        findings.push(
          `${kind}/${seed}: bare source mass lost its reference provenance`,
        );
    }
  }
  if (
    [...camelSeen].sort(compare).join("|") !== "maur1|maur2|maur3|maur4|maur5"
  )
    findings.push(
      "the seeded camel palette did not reach all five actual references",
    );
  if (
    [...deerSeen].sort(compare).join("|") !==
    "boso-adult-female|boso-adult-male"
  )
    findings.push(
      "the seeded deer palette did not reach both actual adult references",
    );

  for (const cohort of [
    "mauritanian-adult-female",
    "maur1",
    "maur2",
    "maur3",
    "maur4",
    "maur5",
  ] as const)
    observation.observe(
      findings,
      `fixed/${cohort}`,
      createCamel({ mass: 450, cohort }, 73),
      references[cohort]!,
      450,
    );
  for (const cohort of ["boso-adult-male", "boso-adult-female"] as const) {
    const expected: observation.Expected = references[cohort]!;
    observation.observe(
      findings,
      `fixed/${cohort}`,
      createDeer({ cohort }, 73),
      expected,
    );
    if (expected.kind === "deer")
      observation.observe(
        findings,
        `antlers off/${cohort}`,
        createDeer({ cohort, antlers: false }, 73),
        { ...expected, antlers: false },
      );
  }
  observation.observe(
    findings,
    "seedless camel remains pooled",
    createCamel({ mass: 450 }),
    references["mauritanian-adult-female"]!,
    450,
  );
  observation.observe(
    findings,
    "canonical seeded camel remains pooled",
    createCamel(createCamel.REFERENCE, 73),
    references["mauritanian-adult-female"]!,
    450,
  );
  observation.observe(
    findings,
    "seedless deer remains male",
    createDeer(),
    references["boso-adult-male"]!,
  );
  observation.observe(
    findings,
    "canonical seeded deer remains male",
    createDeer(createDeer.REFERENCE, 73),
    references["boso-adult-male"]!,
  );

  const lead: NonNullable<createDeer.IParams["lead"]> = {
    width: 0.02,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };
  const equipped: ReturnType<typeof createDeer> = createDeer(
    { cohort: "boso-adult-female", mass: 43, lead },
    73,
  );
  observation.observe(
    findings,
    "authored complete female mass",
    equipped,
    references["boso-adult-female"]!,
    43,
  );
  if (
    equipped.provenance.figures.mass !== undefined ||
    !equipped.affordances.some(
      (contact: { id: string }): boolean => contact.id === "lead",
    )
  )
    findings.push(
      "authored equipped mass became a bare reference figure or its actual lead disappeared",
    );
  for (let index: number = 0; index < 16; index++)
    if (
      createDeer({ antlers: true }, index).provenance.models.cohort !==
      "boso-adult-male"
    )
      findings.push(
        "an explicit sourced-antler request selected an unsupported female reference",
      );
  refused(
    "female antlers",
    (): unknown => createDeer({ cohort: "boso-adult-female", antlers: true }),
    "antlers",
  );
  refused(
    "antler request must be boolean",
    (): unknown =>
      Reflect.apply(createDeer, undefined, [{ antlers: "yes" }, 0]),
    "antlers",
  );
  refused(
    "female equipment needs complete mass",
    (): unknown => createDeer({ cohort: "boso-adult-female", lead }),
    "mass",
  );
  refused(
    "unknown camel cohort",
    (): unknown =>
      Reflect.apply(createCamel, undefined, [
        { mass: 450, cohort: "unknown" },
        0,
      ]),
    "cohort",
  );
  refused(
    "juvenile deer is not an adult reference",
    (): unknown =>
      Reflect.apply(createDeer, undefined, [{ cohort: "boso-male-fawn" }, 0]),
    "cohort",
  );
  refused(
    "camel reference has no fallback mass",
    (): unknown =>
      Reflect.apply(createCamel, undefined, [{ cohort: "maur1" }, 0]),
    "mass",
  );
  refused(
    "null deer mass is not omitted",
    (): unknown => Reflect.apply(createDeer, undefined, [{ mass: null }, 0]),
    "mass",
  );
  refused(
    "null camel mass is not omitted",
    (): unknown => Reflect.apply(createCamel, undefined, [{ mass: null }, 0]),
    "mass",
  );
  for (const body of [AutoMovieArchetypeCamelBody, AutoMovieArchetypeDeerBody])
    for (const height of [null, Number.NaN, Infinity, 0, -1]) {
      try {
        Reflect.apply(body, undefined, [height]);
        findings.push(
          `${body.name}/${height}: invalid explicit body height became a default`,
        );
      } catch (error) {
        if (!(error instanceof RangeError))
          findings.push(
            `${body.name}/${height}: invalid body height lost its dimension refusal`,
          );
      }
    }
  TestValidator.equals(
    "whole-reference geometry, provenance and admission",
    findings,
    [],
  );

  /** Sort closed ASCII source keys explicitly for stable set comparison. */
  function compare(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
  }

  /** Only the actual structured parameter refusal and axis satisfy a negative case. */
  function refused(label: string, call: () => unknown, axis: string): void {
    try {
      call();
      findings.push(`${label}: accepted`);
    } catch (error) {
      if (
        !(error instanceof AutoMovieArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.axis !== axis
      )
        findings.push(`${label}: wrong refusal ${String(error)}`);
    }
  }
}
