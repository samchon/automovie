import { tessellate, tessellateToMesh } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMoviePrimitiveShape,
  IAutoMovieTessellation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `tessellate` emits well-formed mesh data for every primitive, and
 * `tessellateToMesh` adapts it to a full mesh.
 *
 * Scenarios:
 *
 * 1. A 0.4 x 0.6 x 0.2 box has six quad faces with their own four vertices: 24
 *    vertices and 36 indices, every vertex within (0.2, 0.3, 0.1) of the
 *    origin.
 * 2. A sphere of radius 0.5 has complete matching position and normal arrays,
 *    every position at distance 0.5 and every normal of length 1 within 1e-6.
 * 3. For a box, sphere, cylinder, cone, plane and capsule: positions come in
 *    triples, one normal per position, indices in triangles, a non-empty mesh,
 *    and every index inside the vertex range.
 * 4. `tessellateToMesh` of a unit box has 72 position floats, 36 indices and a
 *    null skin.
 */
export function test_engine_geometry_tessellate(): void {
  const box: IAutoMovieTessellation = tessellate({
    type: "box",
    width: 0.4,
    height: 0.6,
    depth: 0.2,
  });
  TestValidator.equals("box vertices", box.positions.length / 3, 24);
  TestValidator.equals("box indices", box.indices.length, 36);
  for (let i: number = 0; i < box.positions.length; i += 3) {
    TestValidator.predicate(
      "x within",
      Math.abs(box.positions[i]!) <= 0.2 + 1e-9,
    );
    TestValidator.predicate(
      "y within",
      Math.abs(box.positions[i + 1]!) <= 0.3 + 1e-9,
    );
    TestValidator.predicate(
      "z within",
      Math.abs(box.positions[i + 2]!) <= 0.1 + 1e-9,
    );
  }

  const sphere: IAutoMovieTessellation = tessellate({
    type: "sphere",
    radius: 0.5,
  });
  TestValidator.predicate(
    "sphere arrays",
    sphere.positions.length > 0 &&
      sphere.positions.length % 3 === 0 &&
      sphere.normals.length === sphere.positions.length,
  );
  for (let i: number = 0; i < sphere.positions.length; i += 3) {
    TestValidator.predicate(
      "on the radius",
      nclose(
        Math.hypot(
          sphere.positions[i]!,
          sphere.positions[i + 1]!,
          sphere.positions[i + 2]!,
        ),
        0.5,
        1e-6,
      ),
    );
    TestValidator.predicate(
      "unit normal",
      nclose(
        Math.hypot(
          sphere.normals[i]!,
          sphere.normals[i + 1]!,
          sphere.normals[i + 2]!,
        ),
        1,
        1e-6,
      ),
    );
  }

  const shapes: IAutoMoviePrimitiveShape[] = [
    { type: "box", width: 0.4, height: 0.6, depth: 0.2 },
    { type: "sphere", radius: 0.5 },
    { type: "cylinder", radius: 0.3, height: 1 },
    { type: "cone", radius: 0.3, height: 1 },
    { type: "plane", width: 2, depth: 3 },
    { type: "capsule", radius: 0.2, height: 1 },
  ];
  for (const shape of shapes) {
    const t: IAutoMovieTessellation = tessellate(shape);
    const vertexCount: number = t.positions.length / 3;
    TestValidator.equals(`${shape.type} triples`, t.positions.length % 3, 0);
    TestValidator.equals(
      `${shape.type} normals`,
      t.normals.length,
      t.positions.length,
    );
    TestValidator.equals(`${shape.type} triangles`, t.indices.length % 3, 0);
    TestValidator.predicate(`${shape.type} vertices`, vertexCount > 0);
    TestValidator.predicate(
      `${shape.type} indices exist`,
      t.indices.length > 0,
    );
    TestValidator.predicate(
      `${shape.type} indices in range`,
      t.indices.every(
        (index: number): boolean => index >= 0 && index < vertexCount,
      ),
    );
  }

  const mesh: IAutoMovieMesh = tessellateToMesh({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  TestValidator.equals("mesh floats", mesh.positions.length, 72);
  TestValidator.equals("mesh indices", mesh.indices?.length, 36);
  TestValidator.equals("mesh skin", mesh.skin, null);
}
