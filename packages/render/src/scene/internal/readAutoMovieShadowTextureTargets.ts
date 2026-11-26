import { AutoMovieEngineRenderShadow } from "@automovie/engine";
import type {
  IAutoMovieRenderTextureTarget,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import type { IAutoMovieShadowTextureHost } from "../IAutoMovieShadowTextureHost.js";
import { guardAutoMovieSceneShadowRetirement } from "../guardAutoMovieSceneShadowRetirement.js";
import { matchesAutoMovieShadowTextureProfile } from "./matchesAutoMovieShadowTextureProfile.js";
import { planAutoMovieShadowTextureTarget } from "./planAutoMovieShadowTextureTarget.js";
import { readAutoMovieRenderTextureTarget } from "./readAutoMovieRenderTextureTarget.js";
import { readAutoMovieShadowLightSource } from "./readAutoMovieShadowLightSource.js";

/**
 * Describe retained light targets and required native shadow factory bounds.
 * Hidden and noncasting lights keep their actual retained map/blur rows. An
 * enabled caster whose next factory differs also supplies a distinct planned
 * row; this conservative phase union is neither an observed GLuint count nor a
 * claim that every retained and planned attachment is simultaneously live.
 * Supply the scene's effective override before configuring its render pass.
 * Otherwise the current host selects the native VSM or legacy PCF allocator
 * family. Compatibility admission remains the Engine's single policy owner.
 * Caller scope and light keys identify distinct retained light-owned slots;
 * include each scope once when assembling a context's renderTargets closure.
 */
export const readAutoMovieShadowTextureTargets: (
  scope: string,
  renderer: IAutoMovieShadowTextureHost,
  lights: ReadonlyMap<string, THREE.Light>,
  effectiveShadows?: IAutoMovieSceneEnvironment["shadows"],
) => IAutoMovieRenderTextureTarget[] = (
  scope: string,
  renderer: IAutoMovieShadowTextureHost,
  lights: ReadonlyMap<string, THREE.Light>,
  effectiveShadows?: IAutoMovieSceneEnvironment["shadows"],
): IAutoMovieRenderTextureTarget[] => {
  guardAutoMovieSceneShadowRetirement(undefined, renderer);
  const records: {
    id: string;
    light: THREE.Light;
    source: NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>>;
  }[] = [...lights].flatMap(
    ([id, light]: [string, THREE.Light]): {
      id: string;
      light: THREE.Light;
      source: NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>>;
    }[] => {
      const source: ReturnType<typeof readAutoMovieShadowLightSource> =
        readAutoMovieShadowLightSource(id, light);
      return source === null ? [] : [{ id, light, source }];
    },
  );
  const profile: ReturnType<typeof AutoMovieEngineRenderShadow.resolveAutoMovieShadowProfile> =
    AutoMovieEngineRenderShadow.resolveAutoMovieShadowProfile({
      lights: records.map(
        (record: {
          id: string;
          light: THREE.Light;
          source: NonNullable<
            ReturnType<typeof readAutoMovieShadowLightSource>
          >;
        }): NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>> =>
          record.source,
      ),
      shadows: effectiveShadows ?? {
        enabled: renderer.shadowMap.enabled,
        type: renderer.shadowMap.type === THREE.VSMShadowMap ? "vsm" : "pcf",
      },
    });
  if (!profile.success)
    throw new Error(
      "Unsupported shadow profile: " + JSON.stringify(profile.violations),
    );
  const rows: IAutoMovieRenderTextureTarget[] = [];
  for (const { id, light, source } of records) {
    // A recorded source is a point, directional or spot light, the lights
    // that own a shadow.
    if (
      !AutoMovieThreeKind.isDirectionalLight(light) &&
      !AutoMovieThreeKind.isSpotLight(light) &&
      !AutoMovieThreeKind.isPointLight(light)
    )
      continue;
    const shadow:
      | THREE.DirectionalLight["shadow"]
      | THREE.SpotLight["shadow"]
      | THREE.PointLight["shadow"] = light.shadow;
    const retained: Map<"map" | "blur", IAutoMovieRenderTextureTarget> =
      new Map<"map" | "blur", IAutoMovieRenderTextureTarget>();
    for (const [role, target] of [
      ["map", shadow.map],
      ["blur", shadow.mapPass],
    ] as const) {
      if (target === null) continue;
      const actual: IAutoMovieRenderTextureTarget | undefined = {
        ...readAutoMovieRenderTextureTarget(
          `shadow-target:${JSON.stringify([scope, id, role, "retained"])}`,
          target,
        ),
        shadow: { scope, light: id, role },
      };
      rows.push(actual);
      retained.set(role, actual);
    }
    if (!profile.enabled || !source.castShadow) continue;
    for (const role of profile.type === "vsm"
      ? (["map", "blur"] as const)
      : (["map"] as const)) {
      const planned: IAutoMovieRenderTextureTarget =
        planAutoMovieShadowTextureTarget(
          scope,
          id,
          shadow,
          source.type === "point",
          profile.type,
          role,
          renderer.capabilities.maxTextureSize,
        );
      const actual: IAutoMovieRenderTextureTarget | undefined =
        retained.get(role);
      if (
        actual === undefined ||
        !matchesAutoMovieShadowTextureProfile(actual, planned)
      )
        rows.push(planned);
    }
  }
  return rows;
};
