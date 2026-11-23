import {
  type IAutoMoviePreparedSpace,
  IAutoMovieSpace,
  IAutoMovieSurface,
} from "@automovie/interface";

import { prepareSpace } from "./prepareSpace";
import { preparedSurfaceContains } from "./preparedSurfaceContains";
import { surfaceHeightAt } from "./surfaceHeightAt";

/** Select the topmost surface at an XZ query, including non-walkable surfaces. */
export const surfaceAt: (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared?: IAutoMoviePreparedSpace,
) => IAutoMovieSurface | null = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): IAutoMovieSurface | null => {
  let best: IAutoMovieSurface | null = null;
  let bestHeight: number = -Infinity;
  for (const entry of prepared.surfaces) {
    if (!preparedSurfaceContains(entry, x, z)) continue;
    const surface: IAutoMovieSurface = entry.surface;
    const height: number = surfaceHeightAt(surface, x, z);
    if (height > bestHeight) {
      best = surface;
      bestHeight = height;
    }
  }
  return best;
};
