import type { IAutoMoviePropSpec } from "@automovie/interface";

import { createModel } from "../fixtures";

/**
 * A legacy prop: no placement, mesh geometry, a part-local transform.
 *
 * Behavior: Constructs the original placementless legacy tetrahedron and part-local transform used by real occupancy and legacy compatibility tests.
 * Expectation basis: Literal mesh vertices and translated local part define hand-computed world bounds under the caller's TRS; no source mesh or expected output snapshot is read.
 * Cases: Preserves the absent placement, original indices and local translation, with rotated/scaled/facing-degree observations and placementless admission owned by callers.
 * Execution: The existing owning entries call sculpture during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function sculpture(): IAutoMoviePropSpec {
  return {
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
  };
}
