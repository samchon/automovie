import type {
  IAutoMovieLight,
  IAutoMovieResolveShadowProfile,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { normalizeShadowFilter } from "./normalizeShadowFilter";

/*
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
export function resolveShadowProfile(
  props: IAutoMovieResolveShadowProfile.IProps,
): IAutoMovieResolveShadowProfile.IResult {
  const policy: { enabled: boolean; type: "pcf" | "pcfSoft" | "vsm" } =
    props.shadows ?? { enabled: true, type: "pcf" };
  const type: "pcf" | "vsm" = normalizeShadowFilter(policy.type);
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  if (policy.enabled && type === "vsm")
    props.lights.forEach(
      (
        light: Pick<IAutoMovieLight, "id" | "type" | "castShadow">,
        index: number,
      ): void => {
        if (light?.type === "point" && light.castShadow === true)
          out.push(
            "type",
            `$input.lights[${index}].castShadow`,
            `Point light "${light.id}" cannot cast a VSM shadow in the supported WebGL profile; use PCF or disable its shadow.`,
            light.castShadow,
          );
      },
    );
  if (out.items.length !== 0)
    return { success: false as const, violations: out.items };
  return {
    success: true as const,
    enabled: policy.enabled,
    type,
    casters: props.lights
      .filter(
        (light: Pick<IAutoMovieLight, "id" | "type" | "castShadow">): boolean =>
          policy.enabled &&
          light?.type !== "area" &&
          light?.castShadow === true,
      )
      .map(
        (
          light: Pick<IAutoMovieLight, "id" | "type" | "castShadow">,
        ): { light: string; depthFaces: number; filterDraws: number } => ({
          light: light.id,
          depthFaces: light.type === "point" ? 6 : 1,
          filterDraws: type === "vsm" ? 2 : 0,
        }),
      ),
  };
}
