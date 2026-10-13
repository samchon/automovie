import { TestValidator } from "@nestia/e2e";
import { modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";

/**
 * Standable ground pays for its tessellated geometry while a zero-area footprint emits none.
 *
 * Scenarios:
 *
 * 1. A convex quad reports four vertices and two triangles per pass; the adjacent sliver adds no geometry.
 */
export const test_render_budget_ground_storage = (): void => {
  // The ground is measured through the same tessellator the viewer draws it
  // with: a convex quad footprint is one fan of two triangles over four
  // vertices, and a footprint enclosing no area draws nothing at all.
  const grounded = measure({
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
        (entry) => entry.metric === "triangles" && entry.owner === "node:yard",
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
};
