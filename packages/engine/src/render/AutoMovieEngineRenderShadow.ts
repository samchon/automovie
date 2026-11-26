import { type IAutoMovieSceneEnvironment, type IAutoMovieResolveShadowProfile } from "@automovie/interface";
import { normalizeAutoMovieShadowFilter as normalizeAutoMovieShadowFilterImplementation } from "./internal/normalizeAutoMovieShadowFilter";
import { resolveAutoMovieShadowProfile as resolveAutoMovieShadowProfileImplementation } from "./internal/resolveAutoMovieShadowProfile";

/** Public operations for Auto Movie Engine Render Shadow. */
export namespace AutoMovieEngineRenderShadow {
  /**
   * Resolve the legacy soft-PCF spelling to the supported PCF filter. The WebGL
   * profile removed a distinct soft-PCF implementation; preserving the authored
   * spelling must not manufacture a separate renderer or evidence identity.
   */
  export function normalizeAutoMovieShadowFilter(type: IAutoMovieSceneEnvironment["shadows"]["type"]): "pcf" | "vsm" {
    return normalizeAutoMovieShadowFilterImplementation(type);
  }

  /**
   * Resolve supported shadow allocation and submission multiplicity together. One
   * light owns one shadow map; a point light rasterizes six cube faces.
   * Directional and spot VSM add two fullscreen filtering triangles after their
   * one depth face. Area lights allocate no shadow map. Disabled and noncasting
   * lights therefore cost no shadow work. No camera culling reduces this bound.
   *
   * Enabled point VSM is refused with the original light path before any resource
   * or fictitious work is priced. Scalar and light-shape admission belong to
   * their existing validators. An omitted policy retains enabled legacy PCF;
   * callers with a renderer target supply that target's effective fallback.
   */
  export function resolveAutoMovieShadowProfile(props: IAutoMovieResolveShadowProfile.IProps): IAutoMovieResolveShadowProfile.IResult {
    return resolveAutoMovieShadowProfileImplementation(props);
  }
}
