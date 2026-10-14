import type { IAutoMovieModel } from "@automovie/interface";

import { productionRuntimeModelId } from "@automovie/engine";

/**
 * Build the formation-framing unit's 0.4-metre-wide/deep member box, translated upward by half the supplied metre height so its floor is zero. The owning entry derives expected extent and lens standoff from this authored shape and varies presence of the model; this unchanged input constructor is not an extent oracle or rendered observation.
 */
export const createFilmFormationMemberModel: (
  MEMBER_HEIGHT: number,
) => IAutoMovieModel = (MEMBER_HEIGHT: number): IAutoMovieModel => ({
  id: productionRuntimeModelId("member"),
  name: null,
  origin: "generated",
  parts: [
    {
      id: "body",
      name: null,
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 0.4, height: MEMBER_HEIGHT, depth: 0.4 },
      },
      material: null,
      attachedBone: null,
      transform: {
        translation: { x: 0, y: MEMBER_HEIGHT / 2, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
  ],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
});
