import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";
import { isAutoMovieLightType } from "../../resolve/isAutoMovieLightType";

/**
 * A light placement's kind, defaulting to the sun-like parallel source.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-refusal Defaults only an omitted staged light kind to directional and returns null for an unsupported authored discriminator.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Defaults only an omitted staged light kind to directional and returns null for an unsupported authored discriminator.
 */
export const lightTypeOf = (
  light: IAutoMovieStageLight,
): IAutoMovieLight["type"] | null => {
  const type = (light as unknown as { type?: unknown }).type;
  if (type === undefined) return "directional";
  return isAutoMovieLightType(type) ? type : null;
};
