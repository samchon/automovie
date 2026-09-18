import { IAutoMovieLight } from "@automovie/interface";
import { AUTO_MOVIE_LIGHT_TYPES } from "./AUTO_MOVIE_LIGHT_TYPES";

/**
 * Whether an untyped artifact names one of the supported light kinds.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Refuses an unrecognized kind before treating raw input as an authored light.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Validates that an input belongs to one declared light-authority branch.
 */
export const isAutoMovieLightType = (
  value: unknown,
): value is IAutoMovieLight["type"] =>
  typeof value === "string" &&
  AUTO_MOVIE_LIGHT_TYPES.has(value as IAutoMovieLight["type"]);
