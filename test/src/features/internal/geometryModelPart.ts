import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One unattached model part of the given geometry, translated by `offset`
 * metres when one is given and otherwise authored in the model frame.
 *
 * @param id Part identity, also its name.
 * @param geometry The part's mesh or primitive geometry.
 * @param offset Translation into the model frame, with no rotation or scale.
 * @returns A fresh part the caller owns.
 */
export const geometryModelPart: (
  id: string,
  geometry: IAutoMovieModelPart["geometry"],
  offset?: IAutoMovieVector3,
) => IAutoMovieModelPart = (
  id: string,
  geometry: IAutoMovieModelPart["geometry"],
  offset?: IAutoMovieVector3,
): IAutoMovieModelPart => ({
  id,
  name: id,
  material: "surface",
  geometry,
  attachedBone: null,
  transform:
    offset === undefined
      ? null
      : {
          translation: { ...offset },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
});
