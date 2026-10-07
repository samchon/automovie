import { productionRuntimeModelId } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

/** Preserve the existing standing member model and height-derived transform. */
export const createFilmFormationMemberModel = (MEMBER_HEIGHT: number): IAutoMovieModel => ({
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
