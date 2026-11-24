import {
  type AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedHeadAttachment,
  AutoMovieArchetypeQuadrupedSkeleton,
  createDeer,
  createDog,
  createOx,
  createQuadruped,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AnimalHeadAppendageObservation as observation } from "../../../internal/AnimalHeadAppendageObservation";
import { nclose } from "../../../internal/nclose";

/** One public source producer and independently stated physical dimensions. */
interface ICase {
  /** Closed actual dog, ox or deer construction input. */
  params: createQuadruped.IParams;
  /** Independently transcribed source controls and named authored geometry. */
  expected: observation.IExpected;
}

/**
 * Actual head appendages have complete connected roots and preserved dimensions.
 *
 * Scenarios:
 * 1. Each of the three Husky cohorts, Kathani ox and both adult Boso deer
 *    references constructs 16 seeds through direct and registry entry points.
 *    Every actual base disk is inside the actual head capsule, while existing
 *    head dimensions, ear/horn/beam/tine lengths and radii remain unchanged.
 * 2. Generic FK applies an authored neck nod and nonidentity root placement.
 *    The same primitive-local containment, branch closure and tip-axis spacing
 *    remain true. Public species selectors must carry each real appendage.
 * 3. Repeats and separate models preserve source bytes; mutating an independent
 *    result or a helper result cannot mutate the original model or hint.
 * 4. General capsule seating preserves already-inside hints, finite side/cap
 *    bearings, the r=R axis boundary and refuses impossible/nonfinite input.
 *    An infinitesimal unrepresentable positive inset is not treated as zero.
 *
 * Huson2025 Table1 supplies eye separation (coarse head diameter), snout,
 * ear and forefoot-circumference controls, all centimetres. Bhagat2022 Table2
 * supplies Kathani head .4292/.1693 m and horn/ear .1757/.1903 m. Deer uses
 * separate same-sex 1997 skull means .2669/.1219 and .2441/.1037 m; its male
 * .489 m beam and .269 m axis-tip control use the 1995 antler table. Ox tube
 * ratios .06/.07 and deer two tines of .28 beam length/.6 radius remain authored.
 * No new biological insertion, bone measure or outer-antler surface is asserted.
 */
export function test_unit_archetypes_animals_animal_head_appendage(): void {
  const findings: string[] = [];
  const antlerRadius: number = (0.0347 + 0.028) / 4;
  const antlers: observation.IExpected = {
    head: 0.2669,
    diameter: 0.1219,
    roots: ["leftAntler", "rightAntler"],
    lengths: {
      leftAntler: 0.489,
      rightAntler: 0.489,
      leftAntlerTine1: 0.489 * 0.28,
      leftAntlerTine2: 0.489 * 0.28,
      rightAntlerTine1: 0.489 * 0.28,
      rightAntlerTine2: 0.489 * 0.28,
    },
    radii: {
      leftAntler: antlerRadius,
      rightAntler: antlerRadius,
      leftAntlerTine1: antlerRadius * 0.6,
      leftAntlerTine2: antlerRadius * 0.6,
      rightAntlerTine1: antlerRadius * 0.6,
      rightAntlerTine2: antlerRadius * 0.6,
    },
    branches: {
      leftAntlerTine1: "leftAntler",
      leftAntlerTine2: "leftAntler",
      rightAntlerTine1: "rightAntler",
      rightAntlerTine2: "rightAntler",
    },
    tips: ["leftAntler", "rightAntler", 0.269],
  };
  const cases: ICase[] = [
    {
      params: { kind: "ox", mass: 300, tempo: 0 },
      expected: {
        head: 0.4292,
        diameter: 0.1693,
        roots: ["leftHorn", "rightHorn", "leftEar", "rightEar"],
        lengths: {
          leftHorn: 0.1757,
          rightHorn: 0.1757,
          leftEar: 0.1903,
          rightEar: 0.1903,
        },
        radii: {
          leftHorn: 0.1757 * 0.06,
          rightHorn: 0.1757 * 0.06,
          leftEar: 0.1903 * 0.07,
          rightEar: 0.1903 * 0.07,
        },
      },
    },
    {
      params: { kind: "deer", cohort: "boso-adult-male", tempo: 0 },
      expected: antlers,
    },
    {
      params: { kind: "deer", cohort: "boso-adult-female", tempo: 0 },
      expected: {
        head: 0.2441,
        diameter: 0.1037,
        roots: [],
        lengths: {},
        radii: {},
      },
    },
  ];
  for (const [cohort, eyes, snout, ear, circumference] of [
    ["pet", 4.45, 9.45, 8.79, 9.91],
    ["show", 4.42, 9.19, 8.43, 10.24],
    ["sled", 4.11, 9.42, 8.38, 10.13],
  ] as const)
    cases.push({
      params: { kind: "dog", cohort, mass: 22, tempo: 0 },
      expected: {
        head: (snout + eyes) / 100,
        diameter: eyes / 100,
        roots: ["leftEar", "rightEar"],
        lengths: { leftEar: ear / 100, rightEar: ear / 100 },
        radii: {
          leftEar: circumference / (2 * Math.PI * 100),
          rightEar: circumference / (2 * Math.PI * 100),
        },
      },
    });

  for (const entry of cases) {
    const input: string = JSON.stringify(entry.params);
    for (let seed: number = 0; seed < 16; seed++) {
      const animal: ReturnType<typeof createQuadruped> = direct(
        entry.params,
        seed,
      );
      const original: string = JSON.stringify(animal);
      observation.observe(
        findings,
        `${entry.params.kind}/${seed}`,
        animal,
        entry.expected,
      );
      observation.neutral(
        findings,
        `${entry.params.kind}/${seed}`,
        animal,
        entry.expected,
      );
      const repeat: ReturnType<typeof createQuadruped> = direct(
        entry.params,
        seed,
      );
      const registry: ReturnType<typeof createQuadruped> = createQuadruped(
        entry.params,
        seed,
      );
      if (
        JSON.stringify(repeat) !== original ||
        JSON.stringify(registry) !== original
      )
        findings.push(
          `${entry.params.kind}/${seed}: repeat or dispatcher changed actual appendages`,
        );
      observation.part(repeat, "head").transform!.translation.x += 1;
      if (
        JSON.stringify(animal) !== original ||
        JSON.stringify(entry.params) !== input
      )
        findings.push(
          `${entry.params.kind}/${seed}: an independent result changed the source`,
        );
      if (seed === 0) pose(animal, entry);
      if (
        entry.params.kind === "deer" &&
        entry.params.cohort === "boso-adult-female" &&
        animal.parts.some((part: IAutoMovieModelPart): boolean =>
          part.id.includes("Antler"),
        )
      )
        findings.push("female reference acquired male appendages");
    }
  }

  const head: Parameters<typeof AutoMovieArchetypeQuadrupedHeadAttachment>[0] =
    {
      poll: { x: 0, y: 0, z: 0 },
      nose: { x: 0, y: 0, z: 2 },
      headRadius: 1,
    };
  const hint: IAutoMovieVector3 = { x: 0.2, y: 0.3, z: 1 };
  const before: string = JSON.stringify({ head, hint });
  const inside: IAutoMovieVector3 = AutoMovieArchetypeQuadrupedHeadAttachment(
    head,
    hint,
    0.1,
  );
  if (JSON.stringify(inside) !== JSON.stringify(hint) || inside === hint)
    findings.push("already seated root was moved or aliased");
  inside.x += 5;
  const side: IAutoMovieVector3 = AutoMovieArchetypeQuadrupedHeadAttachment(
    head,
    { x: 2, y: 0, z: 1 },
    0.25,
  );
  const equal: IAutoMovieVector3 = AutoMovieArchetypeQuadrupedHeadAttachment(
    head,
    { x: 2, y: 0, z: 1 },
    1,
  );
  if (
    !nclose(side.x, 0.75, 1e-12) ||
    side.y !== 0 ||
    side.z !== 1 ||
    equal.x !== 0 ||
    equal.y !== 0 ||
    equal.z !== 1
  )
    findings.push("finite-axis side or equal-radius boundary changed");
  for (const [at, cap] of [
    [{ x: 2, y: 2, z: -2 }, head.poll],
    [{ x: 0, y: 2, z: 3 }, head.nose],
  ] as const) {
    const root: IAutoMovieVector3 = AutoMovieArchetypeQuadrupedHeadAttachment(
      head,
      at,
      0.25,
    );
    if (
      !nclose(
        Math.hypot(root.x - cap.x, root.y - cap.y, root.z - cap.z),
        0.75,
        1e-12,
      )
    )
      findings.push(
        "actual end-cap bearing was not seated inside its own sphere",
      );
  }
  if (JSON.stringify({ head, hint }) !== before)
    findings.push("root seating mutated caller geometry");
  for (const radius of [0, -1, 1.1, Number.MIN_VALUE])
    rejected(`radius/${radius}`, (): unknown =>
      AutoMovieArchetypeQuadrupedHeadAttachment(head, hint, radius),
    );
  rejected("degenerate head", (): unknown =>
    AutoMovieArchetypeQuadrupedHeadAttachment(
      { ...head, nose: { ...head.poll } },
      hint,
      0.1,
    ),
  );
  TestValidator.equals(
    "actual complete head appendage attachment",
    findings,
    [],
  );

  /** Exercise each real producer directly, independently of the public dispatcher. */
  function direct(
    params: createQuadruped.IParams,
    seed: number,
  ): ReturnType<typeof createQuadruped> {
    if (params.kind === "dog") return createDog(params, seed);
    if (params.kind === "ox") return createOx(params, seed);
    if (params.kind === "deer") return createDeer(params, seed);
    throw new Error("This scenario owns only actual head-appendage species");
  }

  /** A genuine generic FK consumer preserves each actual root through a head nod and root placement. */
  function pose(
    animal: ReturnType<typeof createQuadruped>,
    entry: ICase,
  ): void {
    const carriers: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> = {
      withers: "trunk",
    };
    for (const id of Object.keys(entry.expected.lengths)) {
      if (!createQuadruped.SPECIES[entry.params.kind].nodding.includes(id))
        findings.push(
          `${entry.params.kind}/${id}: public carriage selector omitted its actual appendage`,
        );
      carriers[id] = "neck";
    }
    // Every declared contact rides as the producer's nod policy says: listed contacts with the neck, the rest with the trunk.
    const contacts: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> = {};
    for (const contact of animal.affordances)
      contacts[contact.id] = (
        createQuadruped.SPECIES[entry.params.kind].noddingContacts ?? []
      ).includes(contact.id)
        ? "neck"
        : "trunk";
    const joints: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
    > = new Map([["neck", { flexion: 17, abduction: -9, twist: 11 }]]);
    const posed: ReturnType<typeof createQuadruped> =
      AutoMovieArchetypeQuadrupedSkeleton.pose(
        animal,
        joints,
        carriers,
        contacts,
        {
          translation: { x: 2, y: 1, z: -3 },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 0.7),
          scale: { x: 1, y: 1, z: 1 },
        },
      );
    observation.observe(
      findings,
      `${entry.params.kind}/posed`,
      posed,
      entry.expected,
    );
  }

  /** Invalid geometry must refuse instead of producing a fallback root. */
  function rejected(label: string, run: () => unknown): void {
    try {
      run();
      findings.push(`${label}: invalid appendage root admitted`);
    } catch (error) {
      if (!(error instanceof RangeError))
        findings.push(`${label}: wrong geometry refusal ${String(error)}`);
    }
  }
}
