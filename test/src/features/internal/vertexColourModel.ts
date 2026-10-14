import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { createModel } from "./fixtures";

/** Wrap the existing supplied triangles as separate parts sharing one base material; X offsets remain two metres apart and supplied mesh records remain borrowed. */
export function vertexColourModel(meshes: IAutoMovieMesh[]): IAutoMovieModel {
  const base: IAutoMovieModel = createModel(null);
  return {
    ...base,
    parts: meshes.map(
      (mesh: IAutoMovieMesh, index: number): IAutoMovieModelPart => ({
        ...base.parts[0]!,
        id: `triangle-${index}`,
        name: `triangle-${index}`,
        geometry: { type: "mesh", mesh },
        transform: {
          translation: { x: index * 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      }),
    ),
  };
}
