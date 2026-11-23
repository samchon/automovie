import {
  type IAutoMoviePreparedSpace,
  IAutoMovieSpace,
} from "@automovie/interface";

import { prepareSurface } from "./prepareSurface";

/** Prepare every authored surface's rings and areas for repeated space queries. */
export const prepareSpace: (
  space: IAutoMovieSpace,
) => IAutoMoviePreparedSpace = (
  space: IAutoMovieSpace,
): IAutoMoviePreparedSpace =>
  ({
    space,
    surfaces: space.surfaces.map(prepareSurface),
  }) satisfies IAutoMoviePreparedSpace;
