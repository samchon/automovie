import type {
  AutoMovieGuidePass,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderScenePassRenderer } from "../IAutoMovieRenderScenePassRenderer";
import { applyRenderMode } from "./applyRenderMode";
import { applyRendererEnvironment } from "./applyRendererEnvironment";
import { assertSceneShadowProfile } from "./assertSceneShadowProfile";
import { guardRenderModeRetirement } from "./guardRenderModeRetirement";
import { guardSceneShadowRetirement } from "./guardSceneShadowRetirement";
import { invalidateSceneShadowPrograms } from "./invalidateSceneShadowPrograms";
import { readSceneMedium } from "../medium/internal/readSceneMedium";
import { resetSceneShadowTargets } from "./resetSceneShadowTargets";
import { restoreRenderModeState } from "./restoreRenderModeState";

/*
 * Draw a scene sample under reversible environment and material-pass owners. A
 * beauty pass of a scene carrying a medium is refused before anything changes,
 * because the medium is drawn only in a film's linear target. Both owners are
 * restored independently, even after drawing or one restore fails. The primary
 * failure remains first rather than being replaced by a secondary restoration
 * error. Caller-owned scene and renderer are retained.
 */
export const renderScenePassImplementation: (
  renderer: IAutoMovieRenderScenePassRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  pass: AutoMovieGuidePass,
  delivery?: IAutoMovieSceneEnvironment["toneMapping"],
) => void = (
  renderer: IAutoMovieRenderScenePassRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  pass: AutoMovieGuidePass,
  delivery?: IAutoMovieSceneEnvironment["toneMapping"],
): void => {
  // A medium is marched only in a film's linear target, which this pass lacks;
  // structural passes ignore it, as they ignore fog.
  if (pass === "beauty" && readSceneMedium(scene) !== null)
    throw new Error(
      "renderAutoMovieScenePass draws no participating medium; draw a scene with a medium through the film response stage with optics",
    );
  guardSceneShadowRetirement(scene, renderer);
  guardRenderModeRetirement(scene);
  const priorShadows: { enabled: boolean; type: THREE.ShadowMapType } = {
    enabled: renderer.shadowMap.enabled,
    type: renderer.shadowMap.type,
  };
  const requestedShadows: IAutoMovieSceneEnvironment["shadows"] =
    pass === "beauty" && environment !== null && environment !== undefined
      ? environment.shadows
      : {
          enabled: pass === "beauty" && priorShadows.enabled,
          type:
            priorShadows.type === THREE.VSMShadowMap
              ? ("vsm" as const)
              : ("pcf" as const),
        };
  assertSceneShadowProfile(scene, requestedShadows);
  const handle: ReturnType<typeof applyRendererEnvironment> =
    applyRendererEnvironment(renderer, environment, pass, delivery);
  const shadowProgramsChanged: boolean =
    priorShadows.enabled !== renderer.shadowMap.enabled ||
    priorShadows.type !== renderer.shadowMap.type;
  const shadowTargetsChanged: boolean =
    priorShadows.type !== renderer.shadowMap.type;
  let targetRetirementFailed: boolean = false;
  const retireShadowTargets: () => void = (): void => {
    try {
      restoreRenderModeState([
        (): void => {
          renderer.shadowMap.needsUpdate = true;
        },
        (): void => {
          resetSceneShadowTargets(scene, renderer);
        },
      ]);
    } catch (error) {
      targetRetirementFailed = true;
      throw error;
    }
  };
  let mode: ReturnType<typeof applyRenderMode> | undefined;
  const failures: unknown[] = [];
  try {
    if (shadowProgramsChanged) invalidateSceneShadowPrograms(scene);
    if (shadowTargetsChanged) retireShadowTargets();
    mode = applyRenderMode(scene, pass);
    renderer.render(scene, camera);
  } catch (error) {
    failures.push(error);
  }
  if (mode !== undefined)
    try {
      mode.restore();
    } catch (error) {
      failures.push(error);
    }
  try {
    handle.restore();
  } catch (error) {
    failures.push(error);
  }
  if (shadowProgramsChanged)
    try {
      invalidateSceneShadowPrograms(scene);
    } catch (error) {
      failures.push(error);
    }
  if (shadowTargetsChanged && !targetRetirementFailed)
    try {
      retireShadowTargets();
    } catch (error) {
      failures.push(error);
    }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(
      failures,
      "Scene rendering or pass restoration failed.",
    );
};
