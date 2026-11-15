import { ArchetypeMass } from "@automovie/archetypes";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `ArchetypeMass.parts` shares a total mass over the parts by the weights `ArchetypeMass.of` uses, so a broken piece weighs what its parts weighed in the whole.
 *
 * Scenarios:
 * 1. Two boxes of 1 and 2 cubic metres under 3 kg weigh 1 kg and 2 kg.
 * 2. With the larger box's density halved they weigh 1.5 kg each.
 * 3. Shares of 3 and 1 replace the volumes: 2.25 kg and 0.75 kg.
 * 4. A plane, which has no volume, weighs 0 kg and leaves the boxes' masses as they were; a model of planes only weighs 0 kg throughout.
 * 5. The centre the parts' masses place, each at its box's centre, is `of`'s centre of mass, under each of the weightings above.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Shares real masses over primitive parts and compares them with worked figures and with `of`'s centre; a share computed by another rule than `of`'s, a plane given weight or a total lost is caught.
 * @evidence contracts/development/testing.md#independent-expectations The masses are worked here from the boxes' volumes, densities and shares.
 * @evidence contracts/development/testing.md#distinguishing-cases Volume, density and share weightings, a plane beside boxes, and planes alone.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory parts, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_mass_parts(): void {
  const findings: string[] = [];
  const EPSILON: number = 1e-12;
  const part = (
    id: string,
    shape: AutoMoviePrimitiveShape,
    at: IAutoMovieVector3,
  ): IAutoMovieModelPart => ({
    id,
    name: null,
    geometry: { type: "primitive", shape },
    material: null,
    attachedBone: null,
    transform: {
      translation: at,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  });
  const a: IAutoMovieModelPart = part(
    "a",
    { type: "box", width: 1, height: 1, depth: 1 },
    { x: 0, y: 0.5, z: 0 },
  );
  const b: IAutoMovieModelPart = part(
    "b",
    { type: "box", width: 1, height: 1, depth: 2 },
    { x: 2, y: 0.5, z: 0 },
  );
  const plane: IAutoMovieModelPart = part(
    "floor",
    { type: "plane", width: 4, depth: 4 },
    { x: 0, y: 0, z: 0 },
  );

  for (const [label, parts, density, shares, expected] of [
    ["by volume", [a, b], {}, {}, { a: 1, b: 2 }],
    ["with b's density halved", [a, b], { b: 0.5 }, {}, { a: 1.5, b: 1.5 }],
    ["by shares", [a, b], {}, { a: 3, b: 1 }, { a: 2.25, b: 0.75 }],
    ["beside a plane", [a, b, plane], {}, {}, { a: 1, b: 2, floor: 0 }],
  ] as const) {
    const got: Record<string, number> = ArchetypeMass.parts(
      parts,
      3,
      density,
      shares,
    );
    for (const [id, mass] of Object.entries(expected) as [string, number][])
      if (Math.abs((got[id] ?? Number.NaN) - mass) > EPSILON)
        findings.push(`${label}: ${id} weighs ${got[id]} kg, not ${mass} kg`);
    if (Object.keys(got).length !== Object.keys(expected).length)
      findings.push(`${label}: masses for ${Object.keys(got).join(", ")}`);

    // 5. The parts' masses place `of`'s centre.
    const total: number = Object.values(got).reduce(
      (sum: number, m: number): number => sum + m,
      0,
    );
    const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const p of parts) {
      const at: IAutoMovieVector3 = p.transform!.translation;
      const m: number = got[p.id] ?? 0;
      centre.x += (m * at.x) / total;
      centre.y += (m * at.y) / total;
      centre.z += (m * at.z) / total;
    }
    const of: IAutoMovieVector3 = ArchetypeMass.of(
      parts,
      3,
      density,
      shares,
    ).centerOfMass;
    if (
      Math.abs(of.x - centre.x) > EPSILON ||
      Math.abs(of.y - centre.y) > EPSILON ||
      Math.abs(of.z - centre.z) > EPSILON
    )
      findings.push(
        `${label}: the parts place the centre at ${JSON.stringify(centre)}, of at ${JSON.stringify(of)}`,
      );
  }

  // 4. Planes alone weigh nothing.
  const planes: Record<string, number> = ArchetypeMass.parts([plane], 3);
  if (planes.floor !== 0)
    findings.push(`planes alone: the floor weighs ${planes.floor} kg`);
  TestValidator.equals("parts weigh their share of the whole", findings, []);
}
