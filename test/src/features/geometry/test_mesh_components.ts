import { countAutoMovieMeshComponents } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Triangle connectivity follows shared indices, not coincident positions.
 *
 * Scenarios:
 * 1. Two triangles sharing indices form one component.
 * 2. Two disjoint indexed triangles form two components.
 * 3. Coincident triangles with separate indices still form two components.
 * 4. An unused vertex contributes no component to one used triangle.
 * 5. An empty triangle population has zero components.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public component reader on five explicit tiny meshes and collects all observed counts or refusals before asserting.
 * @evidence contracts/development/testing.md#independent-expectations The counts follow the stated vertex-incidence graph: one shared index connects triangles, while distinct index sets remain disjoint regardless of coordinates. The expected integers are derived directly from each graph.
 * @evidence contracts/development/testing.md#distinguishing-cases Shared, disjoint and coincident-but-distinct triangles distinguish index identity from position welding; unused and empty cases pin the used-triangle population. The existing index admission tests own malformed buffers.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit discovered as mesh_components; it builds only in-memory arrays and starts no host, process or whole figure. The supervisor owns the combined runtime gate.
 * @evidence contracts/development/common.md#meaningful-documentation Lists every graph and expected count, including the empty and unused cases and the exclusion of position welding.
 */
export function test_mesh_components(): void {
  const failures: string[] = [];
  const cases: readonly [string, number[], number[], number][] = [
    [
      "shared indexed triangles",
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
      [0, 1, 2, 1, 3, 2],
      1,
    ],
    [
      "disjoint triangles",
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 3, 0, 0, 4, 0, 0, 3, 1, 0],
      [0, 1, 2, 3, 4, 5],
      2,
    ],
    [
      "coincident positions with disjoint indices",
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 2, 3, 4, 5],
      2,
    ],
    [
      "unused vertex ignored",
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 9, 9, 9],
      [0, 1, 2],
      1,
    ],
    ["empty triangles", [], [], 0],
  ];
  for (const [name, positions, indices, expected] of cases) {
    try {
      const actual: number = countAutoMovieMeshComponents({
        positions,
        indices,
        normals: null,
        uvs: null,
        skin: null,
      });
      if (actual !== expected)
        failures.push(name + ": " + actual + " vs " + expected);
    } catch (error: unknown) {
      failures.push(name + ": " + (error instanceof Error ? error.message : String(error)));
    }
  }
  TestValidator.predicate(
    "used-index mesh components: " + failures.join(" | "),
    failures.length === 0,
  );
}
