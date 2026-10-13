import { IAutoMovieRenderBudget } from "@automovie/interface";

/** Build generous independent limits so each over-limit twin isolates one metric. */
export const simulatedRenderBudgetFixture = (): IAutoMovieRenderBudget => ({
  version: 1,
  tier: "review",
  limits: {
    triangles: 100_000,
    vertices: 100_000,
    drawCalls: 100,
    materials: 100,
    textures: 100,
    textureBytes: 1_000_000,
    geometryBytes: 1_000_000,
    lights: 10,
    shadowMaps: 10,
    nodes: 100,
    instanceSets: 10,
    instanceSlots: 100_000,
    instanceChunks: 100,
    fluidCells: 100_000,
    fluidParticles: 100_000,
  },
});
