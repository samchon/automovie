import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";

/**
 * A light placement's kind: its declared `type`, or `"directional"`, the
 * sun-like parallel source, when it is omitted.
 *
 * @param light The staging light placement.
 * @returns The declared kind or the directional default.
 */
export function lightTypeOf(
  light: IAutoMovieStageLight,
): IAutoMovieLight["type"] {
  return light.type ?? "directional";
}
