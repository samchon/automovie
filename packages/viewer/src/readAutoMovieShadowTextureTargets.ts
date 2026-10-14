import { resolveAutoMovieShadowProfile, type IAutoMovieRenderTextureTarget } from "@automovie/engine";
import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieShadowTextureHost } from "./IAutoMovieShadowTextureHost.js";
import { matchesAutoMovieShadowTextureProfile } from "./matchesAutoMovieShadowTextureProfile.js";
import { planAutoMovieShadowTextureTarget } from "./planAutoMovieShadowTextureTarget.js";
import { readAutoMovieRenderTextureTarget } from "./readAutoMovieRenderTextureTarget.js";
import { readAutoMovieShadowLightSource } from "./readAutoMovieShadowLightSource.js";
import { guardAutoMovieSceneShadowRetirement } from "./guardAutoMovieSceneShadowRetirement.js";

/**
 * Describe retained light targets and required native shadow factory bounds. Hidden and noncasting lights keep their actual retained map/blur rows. An enabled caster whose next factory differs also supplies a distinct planned row; this conservative phase union is neither an observed GLuint count nor a claim that every retained and planned attachment is simultaneously live. Supply the scene's effective override before configuring its render pass. Otherwise the current host selects the native VSM or legacy PCF allocator family. Compatibility admission remains the Engine's single policy owner. Caller scope and light keys identify distinct retained light-owned slots; include each scope once when assembling a context's renderTargets closure.
 *
 * @evidence contracts/common.md#principled-implementation Admits the effective Engine shadow profile, reports every actual retained punctual map/blur target and adds distinct planned factory rows only when an enabled caster lacks an equivalent retained profile.
 * @evidence contracts/common.md#clear-and-simple-design Actual source projection, retained target reading, native factory planning and representation comparison keep their existing single owners; scope/light/role labels distinguish phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hidden/noncasting retained storage remains reported, failed retirement under the same original renderer key refuses before reading cleared slots, unsupported profile refuses and phase union is a potential bound rather than measured native lifetimes.
 * @evidence contracts/common.md#meaningful-documentation Documents effective override ordering, installed allocator family, phase semantics and one-scope-once assembly responsibility.
 * @evidence contracts/performance.md#efficient-algorithms L lights are projected once and each has at most two retained/planned roles; attachment-profile comparisons cost their format counts, with O(L) coordinator rows and no shadow texel allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work A retained target covers planned work only when dimensions, representation, faces, samples and attachments match; matching owner text or a prior observation alone is insufficient.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rows are scalar profiles over borrowed lights/targets and this observer acquires no resource; target owners retain/release actual shadows and hosts preserve earlier phase facts until their retirement is observed.
 */
export const readAutoMovieShadowTextureTargets: (scope: string, renderer: IAutoMovieShadowTextureHost, lights: ReadonlyMap<string, THREE.Light>, effectiveShadows?: IAutoMovieSceneEnvironment["shadows"]) => IAutoMovieRenderTextureTarget[] = (
  scope: string,
  renderer: IAutoMovieShadowTextureHost,
  lights: ReadonlyMap<string, THREE.Light>,
  effectiveShadows?: IAutoMovieSceneEnvironment["shadows"],
): IAutoMovieRenderTextureTarget[] => {
  guardAutoMovieSceneShadowRetirement(undefined, renderer);
  const records: {id: string; light: THREE.Light; source: NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>>}[] = [...lights].flatMap(([id, light]: [string, THREE.Light]) : {id: string; light: THREE.Light; source: NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>>}[] => {
    const source: ReturnType<typeof readAutoMovieShadowLightSource> = readAutoMovieShadowLightSource(id, light);
    return source === null ? [] : [{ id, light, source }];
  });
  const profile: ReturnType<typeof resolveAutoMovieShadowProfile> = resolveAutoMovieShadowProfile({
    lights: records.map((record: {id: string; light: THREE.Light; source: NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>>}) : NonNullable<ReturnType<typeof readAutoMovieShadowLightSource>> => record.source),
    shadows: effectiveShadows ?? {
      enabled: renderer.shadowMap.enabled,
      type: renderer.shadowMap.type === THREE.VSMShadowMap ? "vsm" : "pcf",
    },
  });
  if (!profile.success)
    throw new Error("Unsupported shadow profile: " + JSON.stringify(profile.violations));
  const rows: IAutoMovieRenderTextureTarget[] = [];
  for (const { id, light, source } of records) {
    const shadow: THREE.DirectionalLight["shadow"] | THREE.SpotLight["shadow"] | THREE.PointLight["shadow"] = (light as THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight).shadow;
    const retained: Map<"map" | "blur", IAutoMovieRenderTextureTarget> = new Map<"map" | "blur", IAutoMovieRenderTextureTarget>();
    for (const [role, target] of [["map", shadow.map], ["blur", shadow.mapPass]] as const) {
      if (target === null) continue;
      const actual: IAutoMovieRenderTextureTarget | undefined = { ...readAutoMovieRenderTextureTarget(
        `shadow-target:${JSON.stringify([scope, id, role, "retained"])}`, target,
      ), shadow: { scope, light: id, role } };
      rows.push(actual); retained.set(role, actual);
    }
    if (!profile.enabled || !source.castShadow) continue;
    for (const role of profile.type === "vsm" ? ["map", "blur"] as const : ["map"] as const) {
      const planned: IAutoMovieRenderTextureTarget = planAutoMovieShadowTextureTarget(
        scope, id, shadow, source.type === "point", profile.type, role,
        renderer.capabilities.maxTextureSize,
      );
      const actual: IAutoMovieRenderTextureTarget | undefined = retained.get(role);
      if (actual === undefined || !matchesAutoMovieShadowTextureProfile(actual, planned))
        rows.push(planned);
    }
  }
  return rows;
};
