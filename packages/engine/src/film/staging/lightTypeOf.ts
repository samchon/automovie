import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";

import { isAutoMovieLightType } from "../../resolve/isAutoMovieLightType";

/**
 * A light placement's kind: its `type` when that names a supported kind, `"directional"`, the sun-like parallel source, when it is omitted, and `null` when it is anything else.
 *
 * The value is read as `unknown` because `stage` is reachable in-process without the transport's structural gate, so a placement's declared type may not be what its static type claims. `validateLightPlacementShape` reports a `null` answer as a violation; `lowerLightPlacement` runs only after that gate passed and so never sees one.
 *
 * @param light The staging light placement.
 * @returns The supported kind, the directional default, or `null`.
 */
export function lightTypeOf(
  light: IAutoMovieStageLight,
): IAutoMovieLight["type"] | null {
  const type: unknown = light.type;
  if (type === undefined) return "directional";
  return isAutoMovieLightType(type) ? type : null;
}
