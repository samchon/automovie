import {
  type IAutoMoviePreparedSpace,
  IAutoMovieSpace,
  IAutoMovieSurface,
} from "@automovie/interface";

import { prepareSpace } from "./prepareSpace";
import { surfaceAt } from "./surfaceAt";
import { surfaceHeightAt } from "./surfaceHeightAt";

/*
 * Read the topmost walkable surface height, or null over absent or no-go tops.
 */
export const heightAt: (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared?: IAutoMoviePreparedSpace,
) => number | null = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): number | null => {
  const surface: IAutoMovieSurface | null = surfaceAt(space, x, z, prepared);
  if (surface === null) return null;
  if (!space.walkable.includes(surface.id)) return null;
  return surfaceHeightAt(surface, x, z);
};
