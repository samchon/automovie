import type * as THREE from "three";

import type { IAutoMovieRenderShadowRetirementHost } from "../IAutoMovieRenderShadowRetirementHost.js";
import type { IAutoMovieRenderShadowRetirement } from "../IAutoMovieRenderShadowRetirement.js";

/*
 * Guard an exclusive renderer owner's shadow retirement, subsequent scene
 * passes and budget reads. The record lives on the renderer itself
 * (`IAutoMovieRenderShadowRetirementHost.autoMovieShadowRetirement`), including when
 * it is borrowed through a partial capability type; this does not discover
 * alias facades for one native context. A failed attempt retains its scene,
 * original cause and acquired references after light slots withdraw. Another
 * scene on that renderer cannot bypass uncertainty. Success removes the record;
 * an observation-only preflight needs no scene.
 */
export function guardAutoMovieSceneShadowRetirement(
  scene: THREE.Scene | undefined,
  renderer: IAutoMovieRenderShadowRetirementHost,
  attempt?: {
    resources: readonly (THREE.RenderTarget | THREE.Texture)[];
    nativeDepth: readonly WebGLTexture[];
    run: () => void;
  },
): void {
  const previous: IAutoMovieRenderShadowRetirement | undefined =
    renderer.autoMovieShadowRetirement;
  if (previous !== undefined) throw previous.error;
  if (attempt === undefined) return;
  const current: IAutoMovieRenderShadowRetirement = {
    scene,
    resources: [...attempt.resources],
    nativeDepth: [...attempt.nativeDepth],
    error: new Error("The scene's shadow resources are still being retired."),
  };
  renderer.autoMovieShadowRetirement = current;
  try {
    attempt.run();
    delete renderer.autoMovieShadowRetirement;
  } catch (error) {
    current.error = error;
    throw error;
  }
}
