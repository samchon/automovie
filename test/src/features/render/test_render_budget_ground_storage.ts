import { TestValidator } from "@nestia/e2e";

import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { modelsFixture, sceneFixture } from "../internal/renderFixtures";

/**
 * Standable ground pays for its tessellated geometry while a zero-area footprint emits none.
 *
 * Scenarios:
 *
 * 1. A convex quad reports four vertices and two triangles per pass; the adjacent sliver adds no geometry.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the real render inventory of one convex ground quad beside a collinear floor and asserts total triangles, vertices, draws, geometry bytes, node count and editable source ownership.
 * @evidence contracts/testing.md#independent-expectations Four quad vertices and six indices require 4*24+6*4 bytes; two base triangles submitted in the retained two-pass model give four triangles and two draws. The collinear polygon has zero area and must contribute no additional owner or geometry.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the nonzero convex floor and zero-area sliver together while removing staged models/lights from the scene. Mesh, environment-image and fluid storage are covered by neighboring inventory tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_ground_storage owns one portable engine tessellation/inventory case through the existing measurement fixture; it acquires no GPU, viewer or captured frame.
 */
export function test_render_budget_ground_storage(): void {
  // The ground is measured through the same tessellator the viewer draws it
  // with: a convex quad footprint is one fan of two triangles over four
  // vertices, and a footprint enclosing no area draws nothing at all.
  const grounded: ReturnType<typeof measure> = measure({
    scene: {
      ...sceneFixture(),
      nodes: [],
      lights: [],
      space: {
        id: "yard",
        walkable: ["slab"],
        surfaces: [
          {
            id: "slab",
            kind: "floor",
            polygon: [
              { x: 0, y: 0, z: 0 },
              { x: 4, y: 0, z: 0 },
              { x: 4, y: 0, z: 4 },
              { x: 0, y: 0, z: 4 },
            ],
            height: { kind: "constant", value: 0 },
          },
          {
            id: "sliver",
            kind: "floor",
            polygon: [
              { x: 0, y: 0, z: 0 },
              { x: 1, y: 0, z: 0 },
              { x: 2, y: 0, z: 0 },
            ],
            height: { kind: "constant", value: 0 },
          },
        ],
      },
    },
    models: modelsFixture(),
  });

  TestValidator.equals(
    "the standable ground is counted exactly, and an empty footprint costs nothing",
    {
      triangles: grounded.totals.triangles,
      vertices: grounded.totals.vertices,
      drawCalls: grounded.totals.drawCalls,
      geometryBytes: grounded.totals.geometryBytes,
      nodes: grounded.totals.nodes,
      owner: grounded.owners.find(
        (entry: ReturnType<typeof measure>["owners"][number]): boolean =>
          entry.metric === "triangles" && entry.owner === "node:yard",
      )?.source,
    },
    {
      triangles: 4,
      vertices: 4,
      drawCalls: 2,
      geometryBytes: 4 * 24 + 6 * 4,
      nodes: 1,
      owner: "scene.space.surfaces",
    },
  );
}
