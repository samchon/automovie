import type { IAutoMovieRenderInventory } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { flatBasin } from "../internal/fluidFixtures";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { modelsFixture } from "../internal/renderFixtures";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { softPanel } from "../internal/softFixtures";

/**
 * A one-site lattice axis retains its buffers but produces no surface draws.
 *
 * Scenarios:
 *
 * 1. A cloth cord and water rill emit no quads, bind no material, and preserve their resident and fluid costs.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures one-column cloth and one-row water through the engine inventory, asserting zero triangles, draws and materials while retaining vertices, node count, fluid cells and buffer bytes; this catches fabricating a surface or discarding a degenerate domain's resident cost.
 * @evidence contracts/testing.md#independent-expectations A grid axis of one spans no quad, while the authored five cloth particles and four fluid cells still occupy position, normal, UV and water-flow buffers. Literal byte-width arithmetic and input dimensions supply expectations without reading measured output or generated geometry.
 * @evidence contracts/testing.md#distinguishing-cases Both degenerate orientations are combined, distinguishing no submitted surface or material from nonzero resident vertices, nodes and fluid cells. Positive two-dimensional surfaces and their frame-pass costs belong to test_render_simulated_budget.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported test_render_simulated_degenerate_geometry entry performs synchronous numerical inventory work without a cloth solve, fluid step, native mesh, renderer or installed consumer, and owns its complete metric projection assertion.
 */
export function test_render_simulated_degenerate_geometry(): void {
  const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;

  // A cord is not a surface and a single file of cells is not a pond: both hold
  // no quad, both draw nothing, and inventing a sliver for either would be
  // inventing geometry.
  const degenerate: IAutoMovieRenderInventory = measure({
    scene: scene(),
    models: modelsFixture(),
    softBodies: [
      {
        domain: softPanel({ columns: 1, rows: 5 }),
        owner: null,
        material: null,
      },
    ],
    waterBodies: [
      {
        id: "rill",
        owner: null,
        nodes: [],
        domain: flatBasin({ columns: 4, rows: 1, depth: 1 }),
        cells: null,
        particles: null,
        material: null,
      },
    ],
  });

  TestValidator.equals(
    "a one-site lattice axis draws nothing and costs no draw call",
    {
      triangles: degenerate.totals.triangles,
      vertices: degenerate.totals.vertices,
      drawCalls: degenerate.totals.drawCalls,
      nodes: degenerate.totals.nodes,
      fluidCells: degenerate.totals.fluidCells,
      geometryBytes: degenerate.totals.geometryBytes,
      // A mesh the renderer never submits binds no material it ever has to
      // prepare, so a cord and a rill cost their buffers and nothing else.
      materials: degenerate.totals.materials,
    },
    {
      triangles: 0,
      vertices: 5 + 4,
      drawCalls: 0,
      nodes: 2,
      fluidCells: 4,
      geometryBytes: 5 * (12 + 12 + 8) + 4 * (12 + 12 + 8 + 8),
      materials: 0,
    },
  );
}
