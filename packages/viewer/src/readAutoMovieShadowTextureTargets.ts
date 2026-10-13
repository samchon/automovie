import { resolveAutoMovieShadowProfile, type IAutoMovieRenderTextureTarget } from "@automovie/engine";
import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieShadowTextureHost } from "./IAutoMovieShadowTextureHost.js";
import { matchesAutoMovieShadowTextureProfile } from "./matchesAutoMovieShadowTextureProfile.js";
import { planAutoMovieShadowTextureTarget } from "./planAutoMovieShadowTextureTarget.js";
import { readAutoMovieRenderTextureTarget } from "./readAutoMovieRenderTextureTarget.js";
import { readAutoMovieShadowLightSource } from "./readAutoMovieShadowLightSource.js";

/**
 * Describe retained light targets and required native shadow factory bounds.
 * Hidden and noncasting lights keep their actual retained map/blur rows. An
 * enabled caster whose next factory differs also supplies a distinct planned
 * row; this conservative phase union is neither an observed GLuint count nor
 * a claim that every retained and planned attachment is simultaneously live.
 * Supply the scene's effective override before configuring its render pass.
 * Otherwise the current host selects the native VSM or legacy PCF allocator
 * family. Compatibility admission remains the Engine's single policy owner.
 * Caller scope and light keys identify distinct retained light-owned slots;
 * include each scope once when assembling a context's renderTargets closure.
 */
export const readAutoMovieShadowTextureTargets = (
  scope: string,
  renderer: IAutoMovieShadowTextureHost,
  lights: ReadonlyMap<string, THREE.Light>,
  effectiveShadows?: IAutoMovieSceneEnvironment["shadows"],
): IAutoMovieRenderTextureTarget[] => {
  const records = [...lights].flatMap(([id, light]) => {
    const source = readAutoMovieShadowLightSource(id, light);
    return source === null ? [] : [{ id, light, source }];
  });
  const profile = resolveAutoMovieShadowProfile({
    lights: records.map((record) => record.source),
    shadows: effectiveShadows ?? {
      enabled: renderer.shadowMap.enabled,
      type: renderer.shadowMap.type === THREE.VSMShadowMap ? "vsm" : "pcf",
    },
  });
  if (!profile.success)
    throw new Error("Unsupported shadow profile: " + JSON.stringify(profile.violations));
  const rows: IAutoMovieRenderTextureTarget[] = [];
  for (const { id, light, source } of records) {
    const shadow = (light as THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight).shadow;
    const retained = new Map<"map" | "blur", IAutoMovieRenderTextureTarget>();
    for (const [role, target] of [["map", shadow.map], ["blur", shadow.mapPass]] as const) {
      if (target === null) continue;
      const actual = { ...readAutoMovieRenderTextureTarget(
        `shadow-target:${JSON.stringify([scope, id, role, "retained"])}`, target,
      ), shadow: { scope, light: id, role } };
      rows.push(actual); retained.set(role, actual);
    }
    if (!profile.enabled || !source.castShadow) continue;
    for (const role of profile.type === "vsm" ? ["map", "blur"] as const : ["map"] as const) {
      const planned = planAutoMovieShadowTextureTarget(
        scope, id, shadow, source.type === "point", profile.type, role,
        renderer.capabilities.maxTextureSize,
      );
      const actual = retained.get(role);
      if (actual === undefined || !matchesAutoMovieShadowTextureProfile(actual, planned))
        rows.push(planned);
    }
  }
  return rows;
};
