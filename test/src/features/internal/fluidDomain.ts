import type { IAutoMovieFluidDomain } from "@automovie/interface";

/** Build the original two-cell metre-domain fixture with dyadic scalar clock/gravity/depth inputs and shallow overrides. Nested override objects remain borrowed; defaults create fresh arrays and records. Dyadic inputs support selected hand equations but do not prove arbitrary solver arithmetic or cross-platform execution. */
export const fluidDomain: (overrides?: Partial<IAutoMovieFluidDomain>) => IAutoMovieFluidDomain = (
  overrides: Partial<IAutoMovieFluidDomain> = {},
): IAutoMovieFluidDomain => ({
  version: 1,
  id: "pond",
  units: "meter",
  grid: {
    columns: 2,
    rows: 1,
    cellX: 1,
    cellZ: 1,
    origin: { x: 0, y: 0, z: 0 },
  },
  solver: {
    fixedStepSeconds: 0.125,
    gravity: 8,
    drag: 0,
    dryDepth: 0,
    referenceDepth: 1.5,
    maxSteps: 1_000,
  },
  boundaries: { xMin: "wall", xMax: "wall", zMin: "wall", zMax: "wall" },
  bed: [0, 0],
  depth: [1.5, 0.5],
  solid: [false, false],
  sources: [],
  drains: [],
  sprays: [],
  ...overrides,
});
