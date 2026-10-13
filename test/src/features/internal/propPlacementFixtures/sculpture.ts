import type { IAutoMoviePropSpec } from "@automovie/interface";
import { createModel } from "../fixtures";

/** A legacy prop: no placement, mesh geometry, a part-local transform. */
export const sculpture = (): IAutoMoviePropSpec => ({
  node: "sculpture",
  model: {
    ...createModel(null),
    id: "sculpture",
    parts: [
      {
        id: "tetrahedron",
        name: null,
        geometry: {
          type: "mesh",
          mesh: {
            positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
            normals: null,
            uvs: null,
            indices: [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3],
            skin: null,
          },
        },
        material: "mat-1",
        attachedBone: null,
        transform: {
          translation: { x: 0.1, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    ],
  },
  articulation: null,
});
