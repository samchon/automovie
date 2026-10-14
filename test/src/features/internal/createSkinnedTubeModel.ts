import type {
  IAutoMovieMesh,
  IAutoMovieMeshSkin,
  IAutoMovieModel,
} from "@automovie/interface";

import { createSkinnedTubeMesh } from "./createSkinnedTubeMesh";

/**
 * Create a one-part model around {@link createSkinnedTubeMesh}, whose skin
 * binds a root `hips` bone at the origin and a child `spine` bone at y = 1,
 * both with identity rest rotation and no constraint. `method` is written onto
 * the skin, and left out when undefined.
 */
export function createSkinnedTubeModel(
  method?: IAutoMovieMeshSkin["method"],
): IAutoMovieModel {
  const mesh: IAutoMovieMesh = createSkinnedTubeMesh();
  if (method !== undefined) mesh.skin!.method = method;
  return {
    id: "tube",
    name: "tube",
    origin: "generated",
    skeleton: {
      id: "tube-rig",
      bones: [
        {
          bone: "hips",
          parent: null,
          rest: {
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          constraint: null,
        },
        {
          bone: "spine",
          parent: "hips",
          rest: {
            translation: { x: 0, y: 1, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          constraint: null,
        },
      ],
    },
    materials: [
      {
        id: "tube-material",
        name: "tube",
        baseColor: { r: 0.7, g: 0.7, b: 0.75, a: 1, hex: null },
        metallic: 0,
        roughness: 0.6,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
    parts: [
      {
        id: "tube",
        name: "tube",
        geometry: { type: "mesh", mesh },
        material: "tube-material",
        attachedBone: null,
        transform: null,
      },
    ],
    asset: null,
    body: null,
  };
}
