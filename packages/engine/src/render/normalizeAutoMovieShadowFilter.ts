import type { IAutoMovieSceneEnvironment } from "@automovie/interface";

/**
 * Resolve the legacy soft-PCF spelling to the supported PCF filter. The WebGL
 * profile removed a distinct soft-PCF implementation; preserving the authored
 * spelling must not manufacture a separate renderer or evidence identity.
 */
export function normalizeAutoMovieShadowFilter(
  type: IAutoMovieSceneEnvironment["shadows"]["type"],
): "pcf" | "vsm" {
  switch (type) {
    case "pcf":
    case "pcfSoft": return "pcf";
    case "vsm": return "vsm";
    default: throw new Error("Unsupported shadow filter: " + String(type));
  }
}
