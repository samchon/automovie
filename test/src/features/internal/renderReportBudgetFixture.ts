import { IAutoMovieRenderBudget } from "@automovie/interface";

/** Build generous independent limits so each over-limit twin isolates one metric. */
export const renderReportBudgetFixture = (): IAutoMovieRenderBudget => ({
  version: 1,
  tier: "review",
  limits: {
    triangles: 1000,
    vertices: 1000,
    drawCalls: 100,
    materials: 10,
    textures: 5,
    textureBytes: 4_000_000,
    geometryBytes: 10_000,
    lights: 4,
    shadowMaps: 2,
    nodes: 10,
    instanceSets: 2,
    instanceSlots: 100,
    instanceChunks: 10,
    fluidCells: 0,
    fluidParticles: 0,
  },
});
