import { IAutoMovieModel, IAutoMovieSkeleton } from "@automovie/interface";

import { createSkeleton } from "./createSkeleton";

/**
 * Create the existing generated one-box engine model, red material and supplied skeleton, defaulting to the canonical test rig. Each call creates its ordinary model/part/material records; passing null keeps the model skeleton-free.
 */
export function createModel(
  skeleton: IAutoMovieSkeleton | null = createSkeleton(),
): IAutoMovieModel {
  return {
    id: "model-1",
    name: "test model",
    origin: "generated",
    skeleton,
    materials: [
      {
        id: "mat-1",
        name: "red",
        baseColor: { r: 0.8, g: 0.1, b: 0.1, a: 1, hex: null },
        metallic: 0,
        roughness: 0.6,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
    parts: [
      {
        id: "part-1",
        name: "torso",
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 0.4, height: 0.6, depth: 0.2 },
        },
        material: "mat-1",
        attachedBone: null,
        transform: null,
      },
    ],
    asset: null,
    body: null,
  };
}
