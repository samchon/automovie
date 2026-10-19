import type { IAutoMovieBicubicAtlasGeometry } from "../../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry";

/** Create the Bernstein degree elevation of the unit square in model metres. */
export function createBicubicPlaneRecipe(): IAutoMovieBicubicAtlasGeometry {
  return {
    type: "bicubic-atlas",
    topologyDomain: "generic-plane",
    controls: Array.from(
      { length: 16 },
      (_: unknown, i: number): { x: number; y: number; z: number } => ({
        x: (i % 4) / 3,
        y: Math.floor(i / 4) / 3,
        z: 0,
      }),
    ),
    patches: [
      {
        id: "plane",
        controlIds: Array.from(
          { length: 16 },
          (_: unknown, i: number): number => i,
        ),
      },
    ],
    tolerance: 0.001,
    maxCells: 16,
    maxVertices: 128,
  };
}
