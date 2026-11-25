import {
  AutoMovieArchetypeQuadrupedJoints,
  createDog,
  createQuadruped,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AnimalNeutralObservation } from "../../internal/AnimalNeutralObservation";
import { AnimalNeutralReferences } from "../../internal/AnimalNeutralReferences";

/**
 * The neutral fixture set has real connected, grounded, rigid controls.
 *
 * Scenarios:
 *
 * 1. The fixture covers eight kinds, four equid tacks, five pony breeds, two mule
 *    sexes, three dog cohorts, six camel references and both adult deer
 *    references with 200 seeds per explicit case and a total unit budget of 60
 *    s.
 * 2. Actual primitive-centre parent inverses, capsule membership and directed bar
 *    endpoints establish physical attachment and adjacent-joint closure. Real
 *    four-control lengths preserve independent source or declared-transfer
 *    expectations; no attachment calculator supplies an expected answer.
 * 3. Actual cylinder/capsule support places every terminal sole on Y=0 and keeps
 *    every primitive above ground and the neutral torso off the floor. A tilted
 *    cylinder's distal cap centre is not mistaken for its sole.
 * 4. Repeated requests preserve bytes and caller inputs. Mutating a returned read
 *    query or a separately built model cannot mutate another result.
 * 5. Missing/wrong/degenerate/nonrigid bars, broken chains, nonplanar limbs and
 *    physically detached complete chains refuse; binary64 endpoint noise
 *    remains admitted. No foreign method, renderer or process is substituted.
 *
 * Horse controls use Kubo1992 Table4 and Matsuura2008 Table2 with the
 * producer's declared three-decimal normalization precision. The pony/donkey
 * transfer uses the Brooks2010 surface-data cohort means; unmeasured
 * humerus/femur transfer remains provisional. Huson2025 Table1 dog surface
 * controls divide whole feet into two authored bars, not measured canine bones.
 * Ox uses Bhagat2022 Table2 with separate Hakim2019 female-FH controls scaled
 * by the declared height ratio. Camel uses Diop2020 pooled/TableII body rows
 * and the explicitly provisional Mostafa/Khalil2018 four-control transfer. Deer
 * uses Ochiai/Asada1995 Table3 body rows and the separate sex-matched 1997
 * Table7 bones; fourth digits are authored at 0.11 of height. No catalogue row
 * or source SD is an individual population band. Authored dog22/ox300/camel450
 * kg include their drawn equipment and are not study weights.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the fixture's species, cohort and tack coverage, source measurements versus coarse transfers, actual bar/solid frame semantics, source-floor support, isolation and negative admission scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs actual public models for every explicit request and seed, inspects their actual physical geometry, exercises the actual public neutral reader, verifies real tack identities and queries, and submits independently edited real source parts to its refusal boundary.
 * @evidence contracts/development/testing.md#independent-expectations Primary length/body literals and declared transfer arithmetic live in an independent test data owner without importing producer tables. Actual primitive dimensions, quaternion-transformed endpoints, inverse parent-centre coordinates and analytic support functions are the geometric oracles; production read/conform functions never supply expected results. Equine half-quantum tolerances represent documented source normalization precision, while closure, attachment and floor checks remain at 1e-9 m.
 * @evidence contracts/development/testing.md#distinguishing-cases Crosses eight kinds, all four equid tacks and the fixture's named source cohorts over 200 seeds each. Contrasts neutral connected geometry with detached/coplanar-preserving bad chains, malformed versus positive rigid bars, visible gaps versus binary64 noise, cap centres versus true soles and shared-query mutation versus independent builds. Time-varying locomotion/FK and interaction choreography have their separate units.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous unit owns its in-memory public requests, independent source data and observers, malformed actual-part inputs and timing budget. It starts no process, compiler, renderer, watcher, GPU or monkeypatch and claims no rendered or biological validation.
 */
export function test_archetype_animal_neutral_attachment(): void {
  const cases: readonly AnimalNeutralReferences.ICase[] =
    AnimalNeutralReferences.cases();
  const findings: string[] = [];
  const seen: Set<createQuadruped.Kind> = new Set();
  const began: number = Date.now();
  for (const reference of cases) {
    const originalParams: string = JSON.stringify(reference.params);
    for (let seed: number = 0; seed < 200; seed++) {
      const label: string = `${reference.id}/seed=${seed}`;
      try {
        const model: AnimalNeutralObservation.Model = createQuadruped(
          reference.params,
          seed,
        );
        const original: string = JSON.stringify(model);
        const repeated: AnimalNeutralObservation.Model = createQuadruped(
          reference.params,
          seed,
        );
        seen.add(reference.params.kind);
        if (JSON.stringify(repeated) !== original)
          findings.push(`${label}: repeated construction changed bytes`);
        const query: AnimalNeutralObservation.Query =
          AnimalNeutralObservation.inspect(model, reference, label, findings);
        if (JSON.stringify(model) !== original)
          findings.push(
            `${label}: actual geometry queries changed the source model`,
          );
        if (model.skeleton !== null)
          findings.push(
            `${label}: a dummy humanoid skeleton replaced the named animal controls`,
          );
        tack(model, reference.params, label, findings);
        if (seed === 0) {
          const beforeQuery: string = JSON.stringify(query);
          query.limbs.leftFore[0]!.x += 100;
          query.attachments.leftFore.parentLocal.y += 100;
          if (
            JSON.stringify(
              AutoMovieArchetypeQuadrupedJoints.read(model.parts),
            ) !== beforeQuery ||
            JSON.stringify(model) !== original
          )
            findings.push(
              `${label}: returned read data aliases source or a later read`,
            );
          repeated.parts[0]!.transform!.translation.y += 1;
          if (
            JSON.stringify(model) !== original ||
            JSON.stringify(createQuadruped(reference.params, seed)) !== original
          )
            findings.push(
              `${label}: separately built models share mutable geometry`,
            );
        }
      } catch (error) {
        findings.push(
          `${label}: supported neutral construction/observation failed: ${String(error)}`,
        );
      }
      if (JSON.stringify(reference.params) !== originalParams)
        findings.push(`${label}: construction changed its authored input`);
    }
  }
  if (seen.size !== 8)
    findings.push(
      `Only ${[...seen].join(",")} completed actual neutral construction`,
    );
  try {
    refusals(findings);
  } catch (error) {
    findings.push(`Actual malformed-input baseline failed: ${String(error)}`);
  }
  if (Date.now() - began >= 60_000)
    findings.push(
      "The complete 200-seed-per-reference neutral sweep exceeded 60 seconds",
    );
  TestValidator.equals(
    "actual neutral body attachment, lengths and solid support",
    findings,
    [],
  );
}

/**
 * Malformed requests edit real independently built source records without
 * replacing any API.
 */
function refusals(findings: string[]): void {
  const source: ReturnType<typeof createDog> = createDog(
    { mass: 22, cohort: "pet" },
    7,
  );
  const original: string = JSON.stringify(source);
  const bad: readonly (readonly [string, readonly IAutoMovieModelPart[]])[] = [
    [
      "missing actual bone",
      source.parts.filter(
        (part: IAutoMovieModelPart): boolean => part.id !== "leftForeRadius",
      ),
    ],
    [
      "wrong primitive",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          geometry: {
            type: "primitive",
            shape: { type: "sphere", radius: 0.02 },
          },
        }),
      ),
    ],
    [
      "zero height",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart =>
          shape(part, "height", 0),
      ),
    ],
    [
      "negative height",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart =>
          shape(part, "height", -0.1),
      ),
    ],
    [
      "nonfinite radius",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart =>
          shape(part, "radius", Number.NaN),
      ),
    ],
    [
      "missing transform",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          transform: null,
        }),
      ),
    ],
    [
      "scaled bar",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          transform: {
            ...part.transform!,
            scale: { ...part.transform!.scale, x: 1.01 },
          },
        }),
      ),
    ],
    [
      "nonunit rotation",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          transform: {
            ...part.transform!,
            rotation: { x: 0, y: 0, z: 0, w: 0 },
          },
        }),
      ),
    ],
    [
      "nonfinite position",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          transform: {
            ...part.transform!,
            translation: {
              ...part.transform!.translation,
              y: Number.POSITIVE_INFINITY,
            },
          },
        }),
      ),
    ],
    [
      "real adjacent gap",
      edit(
        source.parts,
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          transform: {
            ...part.transform!,
            translation: {
              ...part.transform!.translation,
              z: part.transform!.translation.z + 0.001,
            },
          },
        }),
      ),
    ],
    ["disconnected complete limb", moveChain(source.parts, false)],
    ["nonplanar closed limb", moveChain(source.parts, true)],
    ["repeated actual id", [...source.parts, source.parts[0]!]],
  ];
  for (const [label, parts] of bad) {
    const before: string = snapshot(parts);
    try {
      AutoMovieArchetypeQuadrupedJoints.read(parts);
      findings.push(`${label}: invalid real source was admitted`);
    } catch (error) {
      if (!(error instanceof RangeError))
        findings.push(
          `${label}: source admission lost its explicit geometric refusal`,
        );
    }
    if (snapshot(parts) !== before || JSON.stringify(source) !== original)
      findings.push(`${label}: read admission changed its actual input`);
  }
  const rounded: readonly IAutoMovieModelPart[] = edit(
    source.parts,
    (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
      ...part,
      transform: {
        ...part.transform!,
        translation: {
          ...part.transform!.translation,
          y: part.transform!.translation.y + Number.EPSILON,
        },
      },
    }),
  );
  const beforeRounded: string = snapshot(rounded);
  try {
    AutoMovieArchetypeQuadrupedJoints.read(rounded);
  } catch (error) {
    findings.push(`Binary64 closure noise was refused: ${String(error)}`);
  }
  if (
    snapshot(rounded) !== beforeRounded ||
    JSON.stringify(source) !== original
  )
    findings.push(
      "Source admission changed the binary64-noise input or its original model",
    );
}

/**
 * Preserve nonfinite numeric identity when observing malformed-input
 * immutability.
 */
function snapshot(value: unknown): string {
  return JSON.stringify(
    value,
    (_key: string, member: unknown): unknown => member,
  );
}

/**
 * Real tack identities make the four equid variants genuine consumers of each
 * neutral body.
 */
function tack(
  model: AnimalNeutralObservation.Model,
  params: createQuadruped.IParams,
  label: string,
  findings: string[],
): void {
  let expected: readonly string[];
  if (
    params.kind === "horse" ||
    params.kind === "pony" ||
    params.kind === "donkey" ||
    params.kind === "mule"
  ) {
    const saddle: readonly string[] = [
      "seat",
      "pommel",
      "cantle",
      "leftStirrup",
      "rightStirrup",
      "leftRein",
      "rightRein",
      "lead",
      "mane",
    ];
    expected =
      params.tack === "harness"
        ? ["hitch"]
        : params.tack === "pack"
          ? ["lead", "leftLoad", "rightLoad", "tie"]
          : params.tack === "both"
            ? [...saddle, "hitch"]
            : saddle;
  } else
    expected =
      params.kind === "dog"
        ? ["lead"]
        : params.kind === "ox"
          ? ["lead", "hitch", "head", "horns", "hind"]
          : params.kind === "camel"
            ? ["lead", "leftLoad", "rightLoad"]
            : [];
  const actual: string = model.affordances
    .map((contact: (typeof model.affordances)[number]): string => contact.id)
    .sort((left: string, right: string): number => left.localeCompare(right))
    .join("|");
  if (
    actual !==
    [...expected]
      .sort((left: string, right: string): number => left.localeCompare(right))
      .join("|")
  )
    findings.push(
      `${label}: requested real tack contact identities were not assembled`,
    );
}

/** Edit one real internal link; every other source record remains untouched. */
function edit(
  parts: readonly IAutoMovieModelPart[],
  alter: (part: IAutoMovieModelPart) => IAutoMovieModelPart,
): IAutoMovieModelPart[] {
  return parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart =>
      part.id === "leftForeRadius" ? alter(part) : part,
  );
}

/**
 * Keep the genuine bar kind and every other shape field while making its
 * requested numeric defect.
 */
function shape(
  part: IAutoMovieModelPart,
  key: "height" | "radius",
  value: number,
): IAutoMovieModelPart {
  if (
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new Error("The actual source link must be a real bar");
  return {
    ...part,
    geometry: {
      type: "primitive",
      shape: { ...part.geometry.shape, [key]: value },
    },
  };
}

/**
 * Preserve all four bars and their closure while independently violating
 * attachment or source-plane premises.
 */
function moveChain(
  parts: readonly IAutoMovieModelPart[],
  rotate: boolean,
): IAutoMovieModelPart[] {
  const upper: IAutoMovieModelPart | undefined = parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "leftForeHumerus",
  );
  if (upper === undefined)
    throw new Error("The actual source forelimb is missing");
  const root: IAutoMovieVector3 = AnimalNeutralObservation.endpoint(upper, -1);
  const turn: ReturnType<typeof Quaternion.fromAxisAngle> =
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 10);
  return parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
    if (
      ![
        "leftForeHumerus",
        "leftForeRadius",
        "leftForeCannon",
        "leftForePastern",
      ].includes(part.id)
    )
      return part;
    const at: NonNullable<IAutoMovieModelPart["transform"]> = part.transform!;
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: at.translation.x - root.x,
      y: at.translation.y - root.y,
      z: at.translation.z - root.z,
    });
    return {
      ...part,
      transform: {
        ...at,
        translation: rotate
          ? { x: root.x + offset.x, y: root.y + offset.y, z: root.z + offset.z }
          : { ...at.translation, z: at.translation.z + 10 },
        rotation: rotate
          ? Quaternion.multiply(turn, at.rotation)
          : { ...at.rotation },
        scale: { ...at.scale },
      },
    };
  });
}
