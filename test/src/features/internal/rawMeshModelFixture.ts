import { IAutoMovieModel } from "@automovie/interface";

/** Build six loose vertices without index, normal, UV or skin attributes. */
export const rawMeshModelFixture = (): IAutoMovieModel => ({
  id: "raw-mesh",
  name: null,
  origin: "imported",
  parts: [
    {
      id: "raw-part",
      name: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions: Array.from({ length: 18 }, (_, index) => index),
          normals: null,
          uvs: null,
          indices: null,
          skin: null,
        },
      },
      material: null,
      attachedBone: null,
      transform: null,
    },
  ],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
});
