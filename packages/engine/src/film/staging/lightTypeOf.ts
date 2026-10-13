import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";
import { isAutoMovieLightType } from "../../resolve/isAutoMovieLightType";

/** A light placement's kind, defaulting to the sun-like parallel source. */
export const lightTypeOf = (
  light: IAutoMovieStageLight,
): IAutoMovieLight["type"] | null => {
  const type = (light as unknown as { type?: unknown }).type;
  if (type === undefined) return "directional";
  return isAutoMovieLightType(type) ? type : null;
};
