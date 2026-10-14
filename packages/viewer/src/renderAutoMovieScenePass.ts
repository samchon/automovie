import type {
  AutoMovieGuidePass,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";
import * as THREE from "three";

import { applyRenderMode } from "./applyRenderMode.js";
import { applyRendererEnvironment } from "./applyRendererEnvironment.js";
import { assertAutoMovieSceneShadowProfile } from "./assertAutoMovieSceneShadowProfile.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { guardAutoMovieSceneShadowRetirement } from "./guardAutoMovieSceneShadowRetirement.js";
import { invalidateAutoMovieSceneShadowPrograms } from "./invalidateAutoMovieSceneShadowPrograms.js";
import { resetAutoMovieSceneShadowTargets } from "./resetAutoMovieSceneShadowTargets.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Draw a scene sample under reversible environment and material-pass owners. Both owners are restored independently, even after drawing or one restore fails. The primary failure remains first rather than being replaced by a secondary restoration error. Caller-owned scene and renderer are retained.
 *
 * @evidence contracts/common.md#principled-implementation Refuses failed shadow ownership by renderer key and failed material restoration by scene key before effects, admits requested profile, draws once and independently restores pass/environment/program/target owners without retrying unknown native owners.
 * @evidence contracts/common.md#clear-and-simple-design Existing environment, structural mode, shadow program invalidation and target retirement owners compose one reversible borrowed-scene draw boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported shadow profile refuses before drawing, restoration failures remain observable and no fabricated fallback render or shader value replaces an unobserved native result.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed renderer/scene, original primary error, independent restoration and caller-owned native lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Coordinator checks/operations are fixed plus actual scene traversal, shader invalidation/target retirement and native draw work; changed shadow families alone request their corresponding extra retirement work.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged shadow programs/target family skip invalidation/retirement; each draw still reads current renderer/environment and pass state rather than reusing a stale scene admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pass-created resources retire through their owners and borrowed state restores independently; failed shadow resources/cause stay renderer-keyed and block subsequent passes, while public disposal remains distinct from kernel release proof.
 */
export const renderAutoMovieScenePass: (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  pass: AutoMovieGuidePass,
  delivery?: IAutoMovieSceneEnvironment["toneMapping"],
) => void = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  pass: AutoMovieGuidePass,
  delivery?: IAutoMovieSceneEnvironment["toneMapping"],
): void => {
  guardAutoMovieSceneShadowRetirement(scene, renderer);
  guardAutoMovieRenderModeRetirement(scene);
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
  assertAutoMovieSceneShadowProfile(scene, requestedShadows);
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
      restoreAutoMovieRenderModeState([
        (): void => {
          renderer.shadowMap.needsUpdate = true;
        },
        (): void => {
          resetAutoMovieSceneShadowTargets(scene, renderer);
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
    if (shadowProgramsChanged) invalidateAutoMovieSceneShadowPrograms(scene);
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
      invalidateAutoMovieSceneShadowPrograms(scene);
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
