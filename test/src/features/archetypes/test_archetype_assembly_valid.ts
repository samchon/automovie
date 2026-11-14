import {
  type Archetype,
  ArchetypeAssembly,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "@automovie/archetypes";
import { Quaternion, Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCarriage } from "../internal/archetypeCarriage";
import { qclose, vclose } from "../internal/predicates";

/**
 * An assembly of archetypes is one admitted model whose contacts are its members' under their keys and whose mass properties are its members' combined.
 *
 * Scenarios, for a carriage of three benches, two rails and a low wall, at two seeds:
 * 1. The assembly passes `validateModel`.
 * 2. Every member's every affordance is in it under `<key>/`, its frame the member's composed under the member's placement, within 1e-12 m and in rotation.
 * 3. Its mass is the members' sum and its centre of mass their placed centres' mass-weighted mean, within 1e-9; its moment about a skewed line equals the sum of each member's moment about that line carried into its own space, within 1e-9 of the total.
 * 4. Built twice from the same members, placements and seeds, it serialises to the same text, and its own keys are exactly a model's.
 * 5. No member, a key holding `/`, and a scaled placement are refused at their fields.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds assemblies of produced archetypes and reads the engine's admission, the affordances, the mass properties and the serialisation; a missing or misplaced prefix, a frame left in the member's space, a mass or centre taken from the merged parts instead of the members, an inertia not turned into the assembly's axes, or a malformed member admitted is caught.
 * @evidence contracts/development/testing.md#independent-expectations The frames are composed here from each member's own affordance and its placement with the engine's quaternions; the centre is the mass-weighted mean of the placed centres; a rigid body's moment about a line is invariant under moving both together, so the members' moments about the line carried into each member's space must sum to the assembly's.
 * @evidence contracts/development/testing.md#distinguishing-cases Seats, bars and a wall turned four ways, two seeds, three refusals; riding an assembly belongs to `test_archetype_assembly_ride` and articulating it to `test_archetype_assembly_articulate`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_assembly_valid(): void {
  const findings: string[] = [];
  for (const seed of [4, 19]) {
    const members: archetypeCarriage.Members = archetypeCarriage.members(seed);
    const carriage: ReturnType<typeof archetypeCarriage> = archetypeCarriage(seed);

    // 1. Admitted.
    if (!validateModel({ model: carriage }).success)
      findings.push(`seed ${seed}: the assembly is not admitted`);

    // 2. Every member's affordance under its key.
    let mass: number = 0;
    let weighted: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const [key, member] of Object.entries(members) as [
      string,
      ArchetypeAssembly.IMember,
    ][]) {
      const placement: IAutoMovieTransform = member.placement;
      for (const own of member.archetype.affordances) {
        const found: IAutoMovieAffordance | undefined = carriage.affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === `${key}/${own.id}`,
        );
        const translation: IAutoMovieVector3 = Vector3.add(
          placement.translation,
          Quaternion.rotateVector(placement.rotation, own.frame.translation),
        );
        if (
          found === undefined ||
          !vclose(found.frame.translation, translation, 1e-12) ||
          !qclose(
            found.frame.rotation,
            Quaternion.multiply(placement.rotation, own.frame.rotation),
            1e-12,
          )
        )
          findings.push(`seed ${seed}: ${key}/${own.id}`);
      }
      const m: number = member.archetype.properties.mass;
      mass += m;
      weighted = Vector3.add(
        weighted,
        Vector3.scale(
          Vector3.add(
            placement.translation,
            Quaternion.rotateVector(
              placement.rotation,
              member.archetype.properties.centerOfMass,
            ),
          ),
          m,
        ),
      );
    }
    if (
      carriage.affordances.length !==
      Object.values(members).reduce(
        (sum: number, m: ArchetypeAssembly.IMember): number =>
          sum + m.archetype.affordances.length,
        0,
      )
    )
      findings.push(`seed ${seed}: affordances beyond the members'`);

    // 3. Mass, centre and a moment.
    if (Math.abs(carriage.properties.mass - mass) > 1e-9)
      findings.push(`seed ${seed}: mass ${carriage.properties.mass}, not ${mass}`);
    if (!vclose(carriage.properties.centerOfMass, Vector3.scale(weighted, 1 / mass), 1e-9))
      findings.push(`seed ${seed}: the centre of mass`);
    const through: IAutoMovieVector3 = { x: 0.4, y: 1.1, z: -0.7 };
    const direction: IAutoMovieVector3 = Vector3.normalize({ x: 0.3, y: 1, z: 0.5 });
    let sum: number = 0;
    for (const member of Object.values(members) as ArchetypeAssembly.IMember[]) {
      const inverse: IAutoMovieTransform["rotation"] = Quaternion.inverse(
        member.placement.rotation,
      );
      const archetype: Archetype = member.archetype;
      sum += archetype.moment(
        Quaternion.rotateVector(
          inverse,
          Vector3.subtract(through, member.placement.translation),
        ),
        Quaternion.rotateVector(inverse, direction),
      );
    }
    const total: number = carriage.moment(through, direction);
    if (Math.abs(total - sum) > 1e-9 * total)
      findings.push(`seed ${seed}: moment ${total}, not ${sum}`);

    // 4. Deterministic, and a model's keys only.
    if (JSON.stringify(carriage) !== JSON.stringify(archetypeCarriage(seed)))
      findings.push(`seed ${seed}: two builds serialise differently`);
    if (
      Object.keys(carriage).sort((a: string, b: string): number => a.localeCompare(b)).join() !==
      "affordances,asset,body,id,materials,name,origin,parts,skeleton"
    )
      findings.push(`seed ${seed}: own keys ${Object.keys(carriage).join()}`);
  }

  // 5. Malformed members.
  const bench: ArchetypeAssembly.IMember = archetypeCarriage.members(1).bench1;
  for (const [axis, members] of [
    ["members", {}],
    ["members.a/b", { "a/b": bench }],
    [
      "members.bench.placement.scale",
      {
        bench: {
          ...bench,
          placement: {
            ...ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
            scale: { x: 2, y: 2, z: 2 },
          },
        },
      },
    ],
  ] as const) {
    let thrown: unknown = null;
    try {
      ArchetypeAssembly.of("bad", "bad", members);
    } catch (error) {
      thrown = error;
    }
    if (!(thrown instanceof ArchetypeRefusal) || thrown.axis !== axis)
      findings.push(`expected a refusal at ${axis}, got ${String(thrown)}`);
  }
  TestValidator.equals("an assembly is its members", findings, []);
}
