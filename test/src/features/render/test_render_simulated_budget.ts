import type {
  IAutoMovieRenderInventory,
  IAutoMovieRenderOwnerCost,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { simulatedRenderSubjectFixture } from "../internal/simulatedRenderSubjectFixture";

/**
 * Cloth, planting and water retain their independently calculated geometry and frame-pass costs.
 *
 * Scenarios:
 *
 * 1. The complete simulated inventory and semantic owner rows report lattice, branch and water arithmetic.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the composed cloth, planting and water subject through the actual engine inventory seam and checks every total plus nonzero triangle owner rows, catching omission of a simulated drawable, per-member branch draws, duplicated prototype buffers or lost outline attribution.
 * @evidence contracts/testing.md#independent-expectations A 4-by-3 panel gives twelve vertices and twelve triangles; a 3-by-2 water grid gives six vertices and four triangles. The authored two-child three-level recipe gives seven branches per each of six members, and supplied branch counts and declared attribute/index widths determine storage. Two frame passes multiply submitted work while resident bytes and slots remain single allocations.
 * @evidence contracts/testing.md#distinguishing-cases The combined subject distinguishes three drawable kinds, a named fabric from unnamed materials, shared branch prototype storage from forty-two displayed instances, and editable triangle owners from the outline pass. One-site axes, missing prototypes, shared materials and fluid admission have separate simulated tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_simulated_budget entry measures numerical domain and prototype records synchronously without solving a frame, creating native geometry, installing a consumer or starting a renderer; it owns the two complete-result assertions.
 */
export function test_render_simulated_budget(): void {
  const subject: typeof simulatedRenderSubjectFixture =
    simulatedRenderSubjectFixture;

  // A 4 x 3 curtain: 12 particles, 3 x 2 quads, two triangles each.
  const PANEL_VERTICES: 12 = 12 as const;

  const PANEL_TRIANGLES: 12 = 12 as const;

  const PANEL_BYTES: number =
    PANEL_VERTICES * (12 + 12 + 8) + PANEL_TRIANGLES * 3 * 4;

  // A 3 x 2 basin: 6 cells, 2 x 1 quads, two triangles each; a water vertex
  // carries the flow vector a ripple scrolls along beside position, normal and
  // texture coordinate.
  const WATER_VERTICES: 6 = 6 as const;

  const WATER_TRIANGLES: 4 = 4 as const;

  const WATER_BYTES: number =
    WATER_VERTICES * (12 + 12 + 8 + 8) + WATER_TRIANGLES * 3 * 4;

  // A complete two-child tree of three levels is 1 + 2 + 4 branches, and the
  // cluster places six members of it.
  const BRANCH_INSTANCES: number = 7 * 6;

  const BRANCH: { vertices: number; triangles: number } = {
    vertices: 40,
    triangles: 24,
  };

  const BRANCH_BYTES: number =
    BRANCH.vertices * (12 + 12 + 8) + BRANCH.triangles * 3 * 4;

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES: 2 = 2 as const;

  const inventory: IAutoMovieRenderInventory = measure(subject());

  TestValidator.equals(
    "cloth, planting and water are measured beside the staged world",
    inventory.totals,
    {
      triangles:
        PASSES *
        (PANEL_TRIANGLES +
          BRANCH_INSTANCES * BRANCH.triangles +
          WATER_TRIANGLES),
      vertices:
        PANEL_VERTICES + BRANCH_INSTANCES * BRANCH.vertices + WATER_VERTICES,
      // One panel mesh, one branch batch, one water surface, each drawn once
      // per pass. Six ferns are not six draws, which is the whole reason a bed
      // is affordable.
      drawCalls: PASSES * 3,
      // One named fabric plus the two materials the renderer creates for the
      // batch and the surface that named none.
      materials: 3,
      textures: 1,
      textureBytes: 1024,
      geometryBytes: PANEL_BYTES + BRANCH_BYTES + WATER_BYTES,
      lights: 0,
      shadowMaps: 0,
      nodes: 3,
      instanceSets: 0,
      instanceSlots: BRANCH_INSTANCES,
      instanceChunks: 0,
      fluidCells: 6,
      fluidParticles: 0,
    },
  );

  TestValidator.equals(
    "every simulated cost is attributed and only the repeated pass is classified as pass work",
    inventory.owners
      .filter(
        (entry: IAutoMovieRenderOwnerCost): boolean =>
          entry.metric === "triangles" && entry.cost !== 0,
      )
      .map((entry: IAutoMovieRenderOwnerCost): unknown[] => [
        entry.owner,
        entry.source,
        entry.cost,
        entry.kind,
      ]),
    [
      [
        "planting:atrium-bed",
        'plantings["atrium-bed"]',
        BRANCH_INSTANCES * 24,
        "own",
      ],
      // The extra pass is charged to the pass rather than smeared back over
      // the drawables, so a reader can tell what the room costs from what
      // drawing it twice costs.
      [
        "render-pass:outline",
        "render.pass.outline",
        PANEL_TRIANGLES + BRANCH_INSTANCES * BRANCH.triangles + WATER_TRIANGLES,
        "pass",
      ],
      ["soft-body:panel", 'softBodies["panel"]', PANEL_TRIANGLES, "own"],
      [
        "water-body:atrium-pool",
        'waterBodies["atrium-pool"]',
        WATER_TRIANGLES,
        "own",
      ],
    ],
  );
}
