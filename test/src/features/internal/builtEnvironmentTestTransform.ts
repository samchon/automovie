import { IAutoMovieTransform } from "@automovie/interface";

/** Construct the parent local translation, quaternion and per axis scale used by the tower. */
export const builtEnvironmentTestTransform = (
  x = 0,
  y = 0,
  z = 0,
  rotation: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 },
  scale: IAutoMovieTransform["scale"] = { x: 1, y: 1, z: 1 },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation,
  scale,
});
