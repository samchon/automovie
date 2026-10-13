import { IAutoMovieModel } from "@automovie/interface";

/** Build an indexed skinned quad beside a box to isolate each resident attribute cost. */
export const skinnedMeshModelFixture = (): IAutoMovieModel => ({
  id: "skinned-mesh",
  name: null,
  origin: "imported",
  parts: [
    {
      id: "skin-part",
      name: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions: Array.from({ length: 12 }, (_, index) => index),
          normals: Array.from({ length: 12 }, () => 0),
          uvs: Array.from({ length: 8 }, () => 0),
          indices: [0, 1, 2, 0, 2, 3],
          skin: {
            joints: ["hips"],
            boneIndices: Array.from({ length: 16 }, () => 0),
            weights: Array.from({ length: 16 }, () => 0.25),
          },
        },
      },
      material: "oak",
      attachedBone: null,
      transform: null,
    },
    {
      id: "box-part",
      name: null,
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 1, height: 1, depth: 1 },
      },
      material: "oak",
      attachedBone: null,
      transform: null,
    },
  ],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
});
