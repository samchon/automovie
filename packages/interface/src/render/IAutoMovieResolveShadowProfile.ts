import type { IAutoMovieLight } from "../scene/IAutoMovieLight";
import type { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * Pure shadow-policy inputs and the supported allocation/submission profile.
 * Inputs are borrowed for one synchronous call; outputs are newly owned facts.
 */
export namespace IAutoMovieResolveShadowProfile {
  /**
   * Resolve supported shadow allocation and submission multiplicity together.
   * One light owns one shadow map; a point light rasterizes six cube faces.
   * Directional and spot VSM add two fullscreen filtering triangles after their
   * one depth face. Area lights allocate no shadow map. Disabled and noncasting
   * lights therefore cost no shadow work. No camera culling reduces this
   * bound.
   *
   * Enabled point VSM is refused with the original light path before any
   * resource or fictitious work is priced. Scalar and light-shape admission
   * belong to their existing validators. An omitted policy retains enabled
   * legacy PCF; callers with a renderer target supply that target's effective
   * fallback.
   */
  export type IProps = {
    /**
     * Borrowed lights in source order; only explicitly true castShadow
     * participates.
     */
    lights: readonly Pick<IAutoMovieLight, "id" | "type" | "castShadow">[];
    /**
     * Null/omitted means enabled PCF. pcfSoft normalizes to pcf; vsm is
     * retained.
     */
    shadows?: IAutoMovieSceneEnvironment["shadows"] | null;
  };

  /**
   * Resolve supported shadow allocation and submission multiplicity together.
   * One light owns one shadow map; a point light rasterizes six cube faces.
   * Directional and spot VSM add two fullscreen filtering triangles after their
   * one depth face. Area lights allocate no shadow map. Disabled and noncasting
   * lights therefore cost no shadow work. No camera culling reduces this
   * bound.
   *
   * Enabled point VSM is refused with the original light path before any
   * resource or fictitious work is priced. Scalar and light-shape admission
   * belong to their existing validators. An omitted policy retains enabled
   * legacy PCF; callers with a renderer target supply that target's effective
   * fallback.
   */
  export type IResult =
    | {
        /** Enabled point-light VSM was refused; inspect source-path violations. */
        success: false;
        /**
         * New violations in input order, pointing to each unsupported light's
         * castShadow.
         */
        violations: IAutoMovieConstraintViolation[];
        /** No supported enabled-state result is emitted on refusal. */
        enabled?: undefined;
        /** No supported normalized filter result is emitted on refusal. */
        type?: undefined;
        /** No costable caster list is emitted on refusal. */
        casters?: undefined;
      }
    | {
        /**
         * Policy is supported; does not independently validate all light scalar
         * fields.
         */
        success: true;
        /**
         * Effective global shadow enablement, including the legacy true
         * default.
         */
        enabled: boolean;
        /** Effective filtering mode after the pcfSoft-to-pcf fallback. */
        type: "pcf" | "vsm";
        /**
         * New list in light order; empty when disabled, excluding
         * area/noncasting lights.
         */
        casters: {
          /** Authored light id, scoped by the caller's scene or resident. */
          light: string;
          /**
           * Depth raster faces: six for a point light, one for directional or
           * spot.
           */
          depthFaces: number;
          /** Fullscreen filtering submissions: two for VSM and zero for PCF. */
          filterDraws: number;
        }[];
        /** Successful resolution emits no policy-violation array. */
        violations?: undefined;
      };
}
