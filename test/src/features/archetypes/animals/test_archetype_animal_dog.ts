import { AutoMovieArchetypeRefusal, createDog } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * Dog prototypes preserve whole cited cohorts, declared mass and real tack.
 *
 * Scenarios:
 *
 * 1. Each whole Huson et al. 2025 Table 1 cohort has its measured withers, chest
 *    girth and fore-limb surface spans, with authored mass retained.
 * 2. Seeded selection never blends height/girth between cohorts; unknown paw
 *    friction and skin restitution are absent, and a bare dog has no saddle.
 * 3. An authored collar's real straight lead owns the published contact frame.
 * 4. Missing or invalid mass/tack is refused even though the gallery has an
 *    explicit reference specimen. An unnamed cohort's collar admission is
 *    seed-independent; naming a cohort admits its own neck length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists measured, authored, provisional and refused behaviors without claiming canine anatomy or visual validation.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the public producer's actual parts, total mass, material absence and lead frame. The separate ride test owns gait and posed-consumer checks.
 * @evidence contracts/development/testing.md#independent-expectations Huson et al. 2025 Table 1 centimetres are stated here independently; no producer table or stored serialization supplies them. The collar-width limit follows from the explicitly constructed diagonal neck and circular radius.
 * @evidence contracts/development/testing.md#distinguishing-cases Three nonblended cohorts, seeded draws, bare versus authored collar, unknown material fields and seed-independent explicit refusals.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory public-API test; it launches no host or viewer and makes no wall-time claim.
 */
export function test_archetype_animal_dog(): void {
  // Huson et al. 2025 Table 1, centimetres: height, chest girth,
  // upper/lower fore surface segment and whole forefoot length.
  const cohorts: Readonly<
    Record<
      NonNullable<createDog.IParams["cohort"]>,
      readonly [number, number, number, number, number]
    >
  > = {
    pet: [56.92, 67.23, 20.04, 21.41, 13.56],
    show: [56.85, 62.56, 19.1, 20.93, 12.5],
    sled: [60.22, 64.85, 17.83, 21.29, 12.83],
  };
  const findings: string[] = [];
  const near: (
    label: string,
    actual: number,
    expected: number,
    bound: number,
  ) => void = (
    label: string,
    actual: number,
    expected: number,
    bound: number,
  ): void => {
    if (!(Math.abs(actual - expected) <= bound))
      findings.push(
        `${label}: ${actual}, expected ${expected} within ${bound}`,
      );
  };
  const height: (animal: ReturnType<typeof createDog>, id: string) => number = (
    animal: ReturnType<typeof createDog>,
    id: string,
  ): number => {
    const part: IAutoMovieModelPart | undefined = animal.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === id,
    );
    if (part?.geometry.type !== "primitive") return NaN;
    const shape: typeof part.geometry.shape = part.geometry.shape;
    return shape.type === "cylinder" || shape.type === "capsule"
      ? shape.height
      : NaN;
  };
  for (const cohort of ["pet", "show", "sled"] as const) {
    const animal: ReturnType<typeof createDog> = createDog({
      cohort,
      mass: 22,
      tempo: 0,
    });
    const row: readonly [number, number, number, number, number] =
      cohorts[cohort];
    near(
      `${cohort} withers`,
      archetypeExtent(animal, "y", ["withers"]).high,
      row[0] / 100,
      1e-9,
    );
    near(
      `${cohort} girth`,
      Math.PI * archetypeExtent(animal, "x", ["trunk"]).size,
      row[1] / 100,
      1e-9,
    );
    near(`${cohort} mass`, animal.body.mass, 22, 1e-9);
    near(
      `${cohort} upper fore`,
      height(animal, "leftForeHumerus"),
      row[2] / 100,
      1e-12,
    );
    near(
      `${cohort} lower fore`,
      height(animal, "leftForeRadius"),
      row[3] / 100,
      1e-12,
    );
    near(
      `${cohort} complete forefoot`,
      height(animal, "leftForeCannon") + height(animal, "leftForePastern"),
      row[4] / 100,
      1e-12,
    );
    if (
      animal.surface("leftForePastern") !== null ||
      animal.body.friction !== undefined ||
      animal.body.restitution !== undefined
    )
      findings.push(
        `${cohort}: unknown paw friction or skin restitution was invented`,
      );
    if (animal.affordances.length !== 0)
      findings.push(
        `${cohort}: a bare dog acquired an undeclared rider contact`,
      );
  }
  const seen: Set<string> = new Set();
  for (let seed: number = 0; seed < 200; seed++) {
    const animal: ReturnType<typeof createDog> = createDog({ mass: 22 }, seed);
    const cohort: string | undefined = animal.provenance.models.cohort;
    if (cohort !== "pet" && cohort !== "show" && cohort !== "sled") {
      findings.push(`seed ${seed}: unknown cohort ${cohort}`);
      continue;
    }
    seen.add(cohort);
    near(
      `seed ${seed} whole height`,
      animal.dimensions.withersHeight!,
      cohorts[cohort][0] / 100,
      1e-12,
    );
    near(
      `seed ${seed} whole girth`,
      animal.dimensions.girth!,
      cohorts[cohort][1] / 100,
      1e-12,
    );
  }
  if (seen.size !== 3)
    findings.push("the seeded catalogue never reached every cohort");
  const collar: createDog.ICollar = {
    width: 0.02,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };

  // AutoMovieArchetypeDogBody's explicit diagonal neck construction has length sqrt(2) times
  // the circular radius from the source's neck circumference, not a measured
  // anatomical neck length. This is an independent geometric admission oracle.
  const shortest: number = (Math.sqrt(2) * 35.99) / (2 * Math.PI) / 100;
  const wider: number = (Math.sqrt(2) * (35.99 + 37.41)) / (4 * Math.PI) / 100;
  for (let seed: number = 0; seed < 12; seed++) {
    let error: unknown = null;
    try {
      createDog({ mass: 22, collar: { ...collar, width: wider } }, seed);
    } catch (caught) {
      error = caught;
    }
    if (
      !(
        error instanceof AutoMovieArchetypeRefusal &&
        error.axis === "collar.width" &&
        error.feasible?.kind === "range"
      )
    )
      findings.push(
        `seed ${seed}: collar admission depends on the sampled cohort`,
      );
    else
      near(
        "unnamed cohort collar limit",
        error.feasible.maximum!,
        shortest,
        1e-12,
      );
  }
  createDog({ mass: 22, cohort: "show", collar: { ...collar, width: wider } });
  const dressed: ReturnType<typeof createDog> = createDog({ mass: 22, collar });
  const contact: ReturnType<typeof dressed.affordance> =
    dressed.affordance("lead");
  near("lead actual length", height(dressed, "lead"), 0.6, 1e-12);
  near("lead contact aperture", contact.aperture!, 0.008, 1e-12);
  near(
    "lead contact grip axis",
    Vector3.length(
      Vector3.subtract(
        Quaternion.rotateVector(contact.frame.rotation, { x: 1, y: 0, z: 0 }),
        { x: 1, y: 0, z: 0 },
      ),
    ),
    0,
    1e-12,
  );
  const lead: IAutoMovieModelPart | undefined = dressed.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === "lead",
  );
  if (lead?.transform === null || lead?.transform === undefined)
    findings.push("the lead has no actual placement");
  else
    near(
      "lead contact at actual centre",
      Vector3.length(
        Vector3.subtract(contact.frame.translation, lead.transform.translation),
      ),
      0,
      1e-12,
    );
  const refusals: readonly (() => unknown)[] = [
    // The public JavaScript boundary still refuses absent authored mass;
    // reference metadata is consumed by the gallery, not by the producer.
    (): unknown => Reflect.apply(createDog, undefined, [{}]),
    (): unknown => createDog({ mass: 0 }),
    (): unknown => createDog({ mass: NaN }),
    (): unknown => createDog({ mass: Infinity }),
    (): unknown => createDog({ mass: 22, collar: { ...collar, width: 1 } }),
    (): unknown =>
      createDog({ mass: 22, collar: { ...collar, leadRadius: -1 } }),
  ];
  for (const refuse of refusals) {
    let error: unknown = null;
    try {
      refuse();
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof AutoMovieArchetypeRefusal))
      findings.push("an unsupported dog input did not explicitly refuse");
  }
  TestValidator.equals(
    "the actual dog prototype and authored tack",
    findings,
    [],
  );
}
