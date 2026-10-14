import type { IAutoMovieModel } from "@automovie/interface";

/** The original zero-thickness plane fixture used to distinguish unmeasurable tiers from real columns. */
export const createFormationFlatModel = (
  wide: IAutoMovieModel,
): IAutoMovieModel => {
  return {
    ...wide,
    id: "flat",
    parts: [
      {
        id: "sheet",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "plane", width: 4, depth: 4 },
        },
        material: null,
        attachedBone: null,
        transform: null,
      },
    ],
  };
};
