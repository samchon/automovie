import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSurface } from "./prepareSurface";

/**
 * Precompute every surface footprint hull in a space.
 *
 * @author Samchon
 */
export const prepareSpace = (space: IAutoMovieSpace): IAutoMoviePreparedSpace =>
  ({
    space,
    surfaces: space.surfaces.map(prepareSurface),
  }) satisfies IAutoMoviePreparedSpace;
