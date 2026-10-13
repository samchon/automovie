import { IAutoMovieLight } from "@automovie/interface";

import { AUTO_MOVIE_LIGHT_TYPES } from "./constants/AUTO_MOVIE_LIGHT_TYPES";

/** Whether an untyped artifact names one of the supported light kinds. */
export const isAutoMovieLightType = (
  value: unknown,
): value is IAutoMovieLight["type"] =>
  typeof value === "string" &&
  AUTO_MOVIE_LIGHT_TYPES.has(value as IAutoMovieLight["type"]);
