import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeFriction,
  AutoMovieArchetypeMaterial,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRestitution,
} from "@automovie/archetypes";
import { Vector3, validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A material declaration and a published specimen are not a live-contact coefficient.
 *
 * Scenarios:
 * 1. Published steel, concrete and pinewood self-impact ranges at 1 m/s
 *    retain their primary citation, counterface and specimen; another speed
 *    or pair has no invented row. Returned records are deeply immutable.
 * 2. Out-of-range authored restitution is refused at the builder's actual
 *    boundary.
 * 3. Steel, wood and composite models with no authored coefficient remain
 *    valid kinematic models without restitution. Explicit zero and one
 *    survive, and the friction facade shares the same immutable data owner.
 * 4. Equal authored coefficients on one material can remain a common
 *    assembly declaration; different coefficients, materials or an unknown
 *    member never become a mass-weighted aggregate restitution.
 */
export function test_unit_archetypes_core_contract_material(): void {
  const findings: string[] = [];

  /** Build one analytic body through the actual producer boundary. */
  const build: (
    material: AutoMovieArchetypeMaterial.Kind,
    restitution?: number,
  ) => AutoMovieArchetype = (
    material: AutoMovieArchetypeMaterial.Kind,
    restitution?: number,
  ): AutoMovieArchetype =>
    new AutoMovieArchetypeBuilder<never, never>({
      material,
      name: "material fixture",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "material fixture",
        {},
        undefined,
      ),
    })
      .box("body", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
      .build(1, { restitution });

  /** Each malformed declaration must retain its repairable axis. */
  const refused: (axis: string, action: () => unknown) => void = (
    axis: string,
    action: () => unknown,
  ): void => {
    try {
      action();
      findings.push(`${axis}: malformed declaration was admitted`);
    } catch (error) {
      if (!(error instanceof AutoMovieArchetypeRefusal) || error.axis !== axis)
        findings.push(`${axis}: wrong refusal ${String(error)}`);
    }
  };
  const measured: readonly [AutoMovieArchetypeMaterial.Kind, number, number][] =
    [
      ["steel", 0.514, 0.6239],
      ["concrete", 0.5858, 0.5981],
      ["wood", 0.5334, 0.5797],
    ];
  for (const [material, minimum, maximum] of measured) {
    const row: AutoMovieArchetypeRestitution.IMeasurement | null =
      AutoMovieArchetypeRestitution.measurement(material, material, 1);
    if (
      row === null ||
      !nclose(row.range[0], minimum, 0) ||
      !nclose(row.range[1], maximum, 0) ||
      row.material !== material ||
      row.against !== material ||
      row.speed !== 1 ||
      !row.source.includes("Jankowski 2007") ||
      row.specimen.length === 0 ||
      !Object.isFrozen(row) ||
      !Object.isFrozen(row.range)
    )
      findings.push(
        `${material}: published range, conditions or ownership changed`,
      );
  }
  if (
    !Object.isFrozen(AutoMovieArchetypeRestitution.MEASUREMENTS) ||
    AutoMovieArchetypeRestitution.measurement("wood", "wood", 1.01) !== null ||
    AutoMovieArchetypeRestitution.measurement("wood", "steel", 1) !== null ||
    AutoMovieArchetypeRestitution.measurement("skin", "skin", 1) !== null
  )
    findings.push("an unmeasured contact or speed acquired a reference");
  for (const value of [-0.01, 1.01])
    refused("restitution", (): AutoMovieArchetype => build("steel", value));
  for (const material of ["steel", "wood", "composite"] as const) {
    const body: AutoMovieArchetype = build(material);
    if (
      body.physicalMaterial !== material ||
      "restitution" in body.body ||
      !validateModel({ model: body }).success
    )
      findings.push(
        `${material}: unknown coefficient was invented or blocked construction`,
      );
  }
  for (const value of [0, 1])
    if (build("steel", value).body.restitution !== value)
      findings.push(`explicit coefficient ${value} changed`);
  if (
    AutoMovieArchetypeFriction.PAIRS !== AutoMovieArchetypeMaterial.FRICTION ||
    !Object.isFrozen(AutoMovieArchetypeMaterial.FRICTION) ||
    !Object.isFrozen(
      AutoMovieArchetypeMaterial.friction("wood", "wood", "fixture"),
    )
  )
    findings.push("friction ownership was copied or left mutable");

  /** Compare a real assembly with the explicit contact declarations of its members. */
  const combine: (
    a: AutoMovieArchetype,
    b: AutoMovieArchetype,
  ) => AutoMovieArchetype = (
    a: AutoMovieArchetype,
    b: AutoMovieArchetype,
  ): AutoMovieArchetype =>
    AutoMovieArchetypeAssembly.of("assembly", "material fixture", {
      a: {
        archetype: a,
        placement: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
      },
      b: {
        archetype: b,
        placement: AutoMovieArchetypeFrame.upright(Vector3.create(2, 0, 0)),
      },
    });
  const common: AutoMovieArchetype = combine(
    build("steel", 0),
    build("steel", -0),
  );
  if (common.body.restitution !== 0 || common.physicalMaterial !== "steel")
    findings.push("a common material or explicit zero was lost");
  if (combine(build("steel", 0), build("wood", 0)).physicalMaterial !== null)
    findings.push("a heterogeneous assembly acquired one material");
  for (const pair of [
    [build("steel", 0), build("steel", 1)],
    [build("steel", 0), build("wood", 0)],
    [build("steel", 0), build("steel")],
  ] as const)
    if (combine(pair[0], pair[1]).body.restitution !== undefined)
      findings.push("an unsupported assembly restitution was manufactured");
  TestValidator.equals(
    "materials preserve contact evidence and unknowns",
    findings,
    [],
  );
}
