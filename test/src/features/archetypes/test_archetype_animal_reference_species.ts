import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedSkeleton,
  AutoMovieArchetypeRefusal,
  createCamel,
  createDeer,
  createOx,
  createQuadruped,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/** An actual non-equid model, not a duplicate test representation of its body. */
type Animal = ReturnType<typeof createOx>;

/** Independently transcribed published dimensions and an actual public entry. */
interface Reference {
  /** Public species identity. */
  kind: "ox" | "camel" | "deer";
  /** Named source cohort recorded by the actual producer. */
  cohort: string;
  /**
   * Published withers height, chest circumference and total head length,
   * metres.
   */
  height: number;
  girth: number;
  head: number;
  /** Complete authored kilograms, except the cited bare deer cohort mean. */
  mass: number;
  /**
   * Explicit fixed reference keeps this point-reference unit separate from
   * catalogue variation.
   */
  params: createQuadruped.IParams;
  /** The species' actual public producer with explicit mass ownership. */
  make: (seed: number) => Animal;
}

/**
 * Published point references survive real construction and public dispatch.
 *
 * Scenarios:
 *
 * 1. Each of three real producers and the public kind dispatcher constructs 200
 *    seeded, admissible, deterministic models within a 60-second budget.
 * 2. The actual withers sphere apex, trunk circumference and complete head capsule
 *    agree with independent published metre values at every seed. These inputs
 *    fix the reference key, so seeds do not choose another measured group or
 *    invent unreported population bands around its mean.
 * 3. All 21 animal bones remain actual parts and a generic named skeleton; reads
 *    leave model bytes unchanged and separately built models do not alias.
 * 4. Invalid explicit mass produces actionable refusals. A bare deer alone may
 *    use its cited 60.4 kg mean.
 *
 * Ox: Bhagat et al. 2022 Table 2, Kathani working bullocks (n=2614),
 * https://doi.org/10.56093/ijans.v92i10.105090. Camel: Diop et al. 2020, 131
 * adult Mauritanian females, https://doi.org/10.19182/remvt.31948; its chest
 * girth excludes the hump and head length is occiput-to-nose. Deer: Ochiai and
 * Asada 1995 Table 3, Boso males age 4+ (body mass n=25, other body measures
 * n=27); the separate 1997 Table 7 skull cohort gives the 0.2669 m cranial
 * control, not a paired soft-tissue head measurement:
 * https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_03-2_11ochiai.pdf
 * https://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_04-2_12ochiai.pdf
 * Ox 300 kg and camel 450 kg are authored gallery choices, not survey weights.
 * This checks coarse reference geometry, not population anatomy or visual
 * quality.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three primary references, distinct cohorts and measurement definitions, authored versus measured mass, physical observations and limits of the coarse head controls.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs real public species and registry outputs, admits each complete model, reads actual primitive dimensions and actual named skeletons, and exercises real runtime refusals and query isolation.
 * @evidence contracts/development/testing.md#independent-expectations Expected SI literals are transcribed from the cited primary tables without importing body measurement tables. Sphere apex, circular circumference and capsule total length follow analytic primitive definitions; the independent closed list has five axial and sixteen limb bones. Deterministic bytes compare equivalent public operations, not a saved output snapshot.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three species, 200 distinct seeds each, direct versus registry construction, repeat construction, fixed reference means, read versus destructive mutation of a separate instance, bare measured deer mass and two invalid numeric masses. Equipment geometry and fit failures belong to the adjacent equipment unit.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable synchronous unit owns its in-memory models, seed loop, direct geometry observations and refusal callbacks. The loop measures its own bounded construction budget and starts no process, host, compiler, renderer or patched foreign method.
 */
export function test_archetype_animal_reference_species(): void {
  const references: readonly Reference[] = [
    {
      kind: "ox",
      cohort: "kathani-working-bullock",
      height: 1.1932,
      girth: 1.5061,
      head: 0.4292,
      mass: 300,
      params: { kind: "ox", mass: 300 },
      make: (seed: number): Animal => createOx({ mass: 300 }, seed),
    },
    {
      kind: "camel",
      cohort: "mauritanian-adult-female",
      height: 1.847,
      girth: 1.978,
      head: 0.515,
      mass: 450,
      params: { kind: "camel", mass: 450, cohort: "mauritanian-adult-female" },
      make: (seed: number): Animal =>
        createCamel({ mass: 450, cohort: "mauritanian-adult-female" }, seed),
    },
    {
      kind: "deer",
      cohort: "boso-adult-male",
      height: 0.836,
      girth: 0.92,
      head: 0.2669,
      mass: 60.4,
      params: { kind: "deer", mass: 60.4, cohort: "boso-adult-male" },
      make: (seed: number): Animal =>
        createDeer({ cohort: "boso-adult-male" }, seed),
    },
  ];
  const bones: readonly AutoMovieArchetypeQuadrupedBody.Bone[] = [
    "trunk",
    "hindquarters",
    "neck",
    "head",
    "tail",
    "leftForeScapula",
    "rightForeScapula",
    "leftForeHumerus",
    "leftForeRadius",
    "leftForeCannon",
    "leftForePastern",
    "rightForeHumerus",
    "rightForeRadius",
    "rightForeCannon",
    "rightForePastern",
    "leftHindFemur",
    "leftHindTibia",
    "leftHindCannon",
    "leftHindPastern",
    "rightHindFemur",
    "rightHindTibia",
    "rightHindCannon",
    "rightHindPastern",
  ];
  const expectedBones: string = [...bones]
    .sort((left: string, right: string): number => left.localeCompare(right))
    .join("|");
  const findings: string[] = [];
  const began: number = Date.now();
  for (const reference of references)
    for (let index: number = 0; index < 200; index++) {
      const seed: number = index;
      const label: string = `${reference.kind}/${seed}`;
      const animal: Animal = reference.make(seed);
      const original: string = JSON.stringify(animal);
      const repeat: Animal = reference.make(seed);
      const dispatched: AutoMovieArchetype<
        createQuadruped.Affordance,
        createQuadruped.Dimension
      > = createQuadruped(reference.params, seed);
      if (!validateModel({ model: animal }).success)
        findings.push(`${label}: actual model admission failed`);
      if (
        JSON.stringify(repeat) !== original ||
        JSON.stringify(dispatched) !== original
      )
        findings.push(
          `${label}: repeat or public registry changed model bytes`,
        );
      if (
        animal.archetype !== reference.kind ||
        !nclose(animal.dimensions.withersHeight!, reference.height, 1e-10) ||
        !nclose(animal.dimensions.girth!, reference.girth, 1e-10) ||
        !nclose(animal.body.mass, reference.mass, 1e-10)
      )
        findings.push(`${label}: physical reference or complete mass changed`);
      if (
        animal.provenance.models.cohort !== reference.cohort ||
        animal.provenance.bands.withersHeight !== undefined ||
        animal.provenance.bands.girth !== undefined
      )
        findings.push(
          `${label}: a fixed source cohort became an unsupported population band`,
        );
      const withers: IAutoMovieModelPart = part(animal, "withers");
      const trunk: IAutoMovieModelPart = part(animal, "trunk");
      const head: IAutoMovieModelPart = part(animal, "head");
      if (
        withers.geometry.type !== "primitive" ||
        withers.geometry.shape.type !== "sphere" ||
        !nclose(
          withers.transform!.translation.y + withers.geometry.shape.radius,
          reference.height,
          1e-9,
        )
      )
        findings.push(
          `${label}: actual withers sphere apex differs from published height`,
        );
      if (
        trunk.geometry.type !== "primitive" ||
        trunk.geometry.shape.type !== "capsule" ||
        !nclose(
          2 * Math.PI * trunk.geometry.shape.radius,
          reference.girth,
          1e-9,
        )
      )
        findings.push(
          `${label}: actual trunk circumference differs from source girth`,
        );
      if (
        head.geometry.type !== "primitive" ||
        head.geometry.shape.type !== "capsule" ||
        !nclose(
          head.geometry.shape.height + 2 * head.geometry.shape.radius,
          reference.head,
          1e-9,
        )
      )
        findings.push(
          `${label}: complete head capsule differs from its source control`,
        );
      const rig: ReturnType<typeof AutoMovieArchetypeQuadrupedSkeleton.of> =
        AutoMovieArchetypeQuadrupedSkeleton.of(animal);
      if (
        rig.bones
          .map((bone: (typeof rig.bones)[number]): string => bone.bone)
          .sort((left: string, right: string): number =>
            left.localeCompare(right),
          )
          .join("|") !== expectedBones ||
        bones.some(
          (bone: AutoMovieArchetypeQuadrupedBody.Bone): boolean =>
            !animal.parts.some(
              (candidate: IAutoMovieModelPart): boolean =>
                candidate.id === bone,
            ),
        ) ||
        animal.skeleton !== null ||
        animal.parts.some(
          (candidate: IAutoMovieModelPart): boolean =>
            candidate.attachedBone !== null,
        )
      )
        findings.push(
          `${label}: the complete non-humanoid bone vocabulary was lost`,
        );
      if (
        animal.shapes().length !== animal.parts.length ||
        !nclose(animal.properties.mass, reference.mass, 1e-10)
      )
        findings.push(
          `${label}: collider or mass queries do not describe the actual model`,
        );
      if (JSON.stringify(animal) !== original)
        findings.push(`${label}: read-only queries changed the model`);
      if (index === 0) {
        part(animal, "trunk").transform!.translation.x += 1;
        if (
          JSON.stringify(repeat) !== original ||
          JSON.stringify(reference.make(seed)) !== original
        )
          findings.push(
            `${label}: independent constructions share mutable geometry`,
          );
      }
    }
  const elapsed: number = Date.now() - began;
  if (elapsed >= 60_000)
    findings.push(
      `600 real reference samples exceeded their 60-second budget: ${elapsed} ms`,
    );

  for (const mass of [0, -1])
    for (const kind of ["ox", "camel", "deer"] as const)
      refusal(
        findings,
        `${kind} invalid mass ${mass}`,
        (): unknown => createQuadruped({ kind, mass }, 3),
        kind,
        "mass",
        mass,
      );
  TestValidator.equals("published animal reference behavior", findings, []);
}

/**
 * Read a real named primitive; absence is a construction failure, not an oracle
 * fallback.
 */
function part(animal: Animal, id: string): IAutoMovieModelPart {
  const found: IAutoMovieModelPart | undefined = animal.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (found === undefined || found.transform === null)
    throw new Error(
      `The actual ${animal.archetype} is missing transformed part ${id}`,
    );
  return found;
}

/**
 * Require the real refusal's class, physical axis, exact input and actionable
 * guidance.
 */
function refusal(
  findings: string[],
  label: string,
  run: () => unknown,
  archetype: string,
  axis: string,
  value: unknown,
): void {
  try {
    run();
    findings.push(`${label}: the invalid request was accepted`);
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.kind !== "parameter" ||
      error.archetype !== archetype ||
      error.axis !== axis ||
      !Object.is(error.value, value) ||
      error.reason.length === 0 ||
      error.fix.length === 0
    )
      findings.push(
        `${label}: the refusal lost its actual request or guidance`,
      );
  }
}
