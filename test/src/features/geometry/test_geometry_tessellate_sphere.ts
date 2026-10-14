import { tessellate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Sphere tessellation preserves the authored Euclidean radius and unit normal lengths with nonempty complete arrays; these numerical checks do not establish lighting appearance.
 *
 * Scenarios:
 * 1. A radius-0.5 sphere has nonempty XYZ positions and equally sized normal storage.
 * 2. Every position has radius 0.5 and every normal has length one within 1e-6.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sphere tessellation and checks a nonempty complete vertex/normal layout, radial distances and normal lengths; an empty or off-radius surface fails.
 * @evidence contracts/testing.md#independent-expectations The authored radius 0.5 and unit-vector norm define independent Euclidean expectations; these measurements establish numerical shape facts, not lighting appearance.
 * @evidence contracts/testing.md#distinguishing-cases This unit owns the finite radius-0.5 sphere and rejects vacuous empty output; watertight, winding and capsule cases belong to the adjacent tessellation units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_tessellate_sphere entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_tessellate_sphere(): void {
  const r: number = 0.5;
  const sphere: import("@automovie/engine").ITessellation = tessellate({ type: "sphere", radius: r });

  TestValidator.predicate("sphere arrays contain complete matching vertices", sphere.positions.length > 0 && sphere.positions.length % 3 === 0 && sphere.normals.length === sphere.positions.length);
  let onRadius: boolean = true;
  for (let i: number = 0; i < sphere.positions.length; i += 3) {
    const x: number = sphere.positions[i]!;
    const y: number = sphere.positions[i + 1]!;
    const z: number = sphere.positions[i + 2]!;
    if (!nclose(Math.sqrt(x * x + y * y + z * z), r, 1e-6)) onRadius = false;
  }
  TestValidator.predicate("every vertex on the radius", onRadius);

  let unitNormals: boolean = true;
  for (let i: number = 0; i < sphere.normals.length; i += 3) {
    const x: number = sphere.normals[i]!;
    const y: number = sphere.normals[i + 1]!;
    const z: number = sphere.normals[i + 2]!;
    if (!nclose(Math.sqrt(x * x + y * y + z * z), 1, 1e-6)) unitNormals = false;
  }
  TestValidator.predicate("every normal is unit", unitNormals);
}
