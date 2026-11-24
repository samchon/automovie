import type * as THREE from "three";

import { AutoMovieThreeKind } from "./AutoMovieThreeKind.js";
import type { IAutoMovieFramebufferRenderer } from "./IAutoMovieFramebufferRenderer.js";
import type { IAutoMovieShadowRetirementHost } from "./IAutoMovieShadowRetirementHost.js";
import { guardAutoMovieSceneShadowRetirement } from "./guardAutoMovieSceneShadowRetirement.js";
import { readAutoMovieCubeShadowDepth } from "./readAutoMovieCubeShadowDepth.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";
import { retireAutoMovieCubeShadowDepth } from "./retireAutoMovieCubeShadowDepth.js";

/**
 * Retire every scene light's retained shadow attachment after a filter change.
 *
 * PCF comparison depth and VSM ordinary depth/distribution attachments are
 * different GPU products. Three's previous filter is renderer-global while
 * targets belong to individual lights, so a light hidden during a switch can
 * retain the wrong product. Include hidden lights, clear public target slots,
 * and mark their next shadow draw dirty. Disposal attempts every unique target
 * and depth texture even if an independent resource listener fails. Retained
 * targets belong exclusively to this renderer context and the scene's complete
 * light population. External depth borrowers must be detached before
 * retirement; an observable caller destination borrowing these resources is
 * rejected before mutation. Native cube depth is queried before disposal and
 * its still-live handle is released once without changing SDK bookkeeping. A
 * cube depth with version zero is known uninitialized in Three r186 and is
 * disposed without binding or allocating it. Positive version is not evidence
 * of GPU residency; all other queried cubes must be actual retained draws in
 * this context, not manually assigned CPU-only maps dirtied with needsUpdate.
 */
export const resetAutoMovieSceneShadowTargets: (
  scene: THREE.Scene,
  renderer: IAutoMovieFramebufferRenderer & IAutoMovieShadowRetirementHost,
) => void = (
  scene: THREE.Scene,
  renderer: IAutoMovieFramebufferRenderer & IAutoMovieShadowRetirementHost,
): void => {
  guardAutoMovieSceneShadowRetirement(scene, renderer);
  const resources: Set<THREE.RenderTarget | THREE.Texture> = new Set<
    THREE.RenderTarget | THREE.Texture
  >();
  const nativeDepth: Set<WebGLTexture> = new Set<WebGLTexture>();
  const failures: unknown[] = [];
  const shadows: Array<THREE.LightShadow> = [];
  const targets: Set<THREE.RenderTarget> = new Set<THREE.RenderTarget>();
  scene.traverse((object: THREE.Object3D): void => {
    // The lights that own a shadow: directional, point and spot.
    if (
      !AutoMovieThreeKind.isDirectionalLight(object) &&
      !AutoMovieThreeKind.isPointLight(object) &&
      !AutoMovieThreeKind.isSpotLight(object)
    )
      return;
    const shadow: THREE.LightShadow = object.shadow;
    shadows.push(shadow);
    for (const target of [shadow.map, shadow.mapPass])
      if (target !== null) {
        targets.add(target);
        resources.add(target);
        if (target.depthTexture !== null) resources.add(target.depthTexture);
      }
  });
  const destination: ReturnType<THREE.WebGLRenderer["getRenderTarget"]> =
    renderer.getRenderTarget();
  if (
    destination !== null &&
    (targets.has(destination) ||
      (destination.depthTexture !== null &&
        resources.has(destination.depthTexture)))
  )
    throw new Error(
      "Cannot retire shadow attachments borrowed by the caller's current render destination.",
    );
  for (const target of targets) {
    if (
      AutoMovieThreeKind.isWebGLCubeRenderTarget(target) &&
      target.depthTexture !== null &&
      target.depthTexture.version !== 0
    ) {
      try {
        const handle: WebGLTexture | null = readAutoMovieCubeShadowDepth(
          renderer,
          target,
        );
        if (handle !== null) nativeDepth.add(handle);
      } catch (error) {
        failures.push(error);
      }
    }
    target.depthTexture = null;
  }
  for (const shadow of shadows) {
    shadow.map = null;
    shadow.mapPass = null;
    shadow.needsUpdate = true;
  }
  guardAutoMovieSceneShadowRetirement(scene, renderer, {
    resources: [...resources],
    nativeDepth: [...nativeDepth],
    run: (): void =>
      restoreAutoMovieRenderModeState([
        ...failures.map((error: unknown): (() => void) => (): void => {
          throw error;
        }),
        ...Array.from(
          resources,
          (resource: THREE.RenderTarget | THREE.Texture): (() => void) =>
            (): void => {
              resource.dispose();
            },
        ),
        ...Array.from(
          nativeDepth,
          (handle: WebGLTexture): (() => void) =>
            (): void => {
              retireAutoMovieCubeShadowDepth(renderer, handle);
            },
        ),
      ]),
  });
};
