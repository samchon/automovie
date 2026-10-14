import type {
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { normalizeAutoMovieShadowFilter } from "./normalizeAutoMovieShadowFilter";

/**
 * Resolve supported shadow allocation and submission multiplicity together.
 * One light owns one shadow map; a point light rasterizes six cube faces.
 * Directional and spot VSM add two fullscreen filtering triangles after their
 * one depth face. Area lights allocate no shadow map. Disabled and noncasting
 * lights therefore cost no shadow work. No camera culling reduces this bound.
 *
 * Enabled point VSM is refused with the original light path before any resource
 * or fictitious work is priced. Scalar and light-shape admission belong to
 * their existing validators. An omitted policy retains enabled legacy PCF;
 * callers with a renderer target supply that target's effective fallback.
 *
 * @evidence contracts/common.md#principled-implementation Normalize one effective policy and jointly derive shadow-map ownership, point six-face depth multiplicity and directional/spot VSM filtering draws; enabled point VSM produces path-addressed violations before any supported cost is emitted.
 * @evidence contracts/common.md#clear-and-simple-design One profile feeds both allocation closure and frame submission counts, while scalar/light-shape validators remain the admission owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted policy retains enabled legacy PCF; area/noncasting/disabled lights produce no casters and unsupported point VSM is refused rather than priced as fictional supported work.
 * @evidence contracts/common.md#meaningful-documentation Props document borrowed lights/policy and the result discriminant distinguishes violations from supported casters; comments give depth/filter multiplicities and camera-independent scope.
 * @evidence contracts/performance.md#efficient-algorithms L lights require a validation pass when enabled VSM plus filter/map passes for supported casters, O(L) time and O(C+V) output for casters/violations.
 * @evidence contracts/performance.md#reuse-equivalent-work The same resolved profile is reused for storage requirements and draw bounds in one inventory request; changed policy/light facts require a new profile.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar caster/violation records escape; no shadow target, native light, task or context lifecycle is retained.
 */
export function resolveAutoMovieShadowProfile(props: {
  lights: readonly Pick<IAutoMovieLight, "id" | "type" | "castShadow">[];
  shadows?: IAutoMovieSceneEnvironment["shadows"] | null;
}):
  | {
      success: false;
      violations: IAutoMovieConstraintViolation[];
      enabled?: undefined;
      type?: undefined;
      casters?: undefined;
    }
  | {
      success: true;
      enabled: boolean;
      type: "pcf" | "vsm";
      casters: { light: string; depthFaces: number; filterDraws: number }[];
      violations?: undefined;
    } {
  const policy: { enabled: boolean; type: "pcf" | "pcfSoft" | "vsm" } =
    props.shadows ?? { enabled: true, type: "pcf" };
  const type: "pcf" | "vsm" = normalizeAutoMovieShadowFilter(policy.type);
  const out: ViolationCollector = new ViolationCollector();
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
