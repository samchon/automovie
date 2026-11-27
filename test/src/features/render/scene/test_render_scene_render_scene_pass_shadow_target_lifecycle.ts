import { type IAutoMovieScenePassRenderer, type IAutoMovieShadowTextureHost, AutoMovieRenderScenePass, AutoMovieSceneShadow } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createScenePassRendererDouble } from "../../internal/createScenePassRendererDouble";
import { observeThrownValue as caughtFailure } from "../../internal/observeThrownValue";

/** Observe the public mutable slots after an operation that owns their change. */
const readShadowSlots: (shadow: THREE.LightShadow) => {
  map: THREE.RenderTarget | null;
  mapPass: THREE.RenderTarget | null;
  needsUpdate: boolean;
} = (
  shadow: THREE.LightShadow,
): {
  map: THREE.RenderTarget | null;
  mapPass: THREE.RenderTarget | null;
  needsUpdate: boolean;
} => ({
  map: shadow.map,
  mapPass: shadow.mapPass,
  needsUpdate: shadow.needsUpdate,
});

/** Reuse the existing inline orchestration facts with an owned draw callback. */
/** A scene-pass renderer that also reports its texture size limit. */
type Renderer = IAutoMovieScenePassRenderer & IAutoMovieShadowTextureHost;

function rendererFacts(draw: () => void): Renderer {
  return {
    ...createScenePassRendererDouble(draw),
    capabilities: { maxTextureSize: 4096 },
  };
}

/**
 * A filter change retires all retained per-light shadow products, including a
 * hidden light, so renderer-global filter history cannot admit stale depth.
 *
 * Scenarios:
 *
 * 1. Empty, ordinary and non-shadow lights remain valid; hidden shadow lights
 *    release shared targets/depth exactly once and clear their public slots.
 * 2. Independent disposal failures preserve both errors after every slot is
 *    cleared and later resources have been attempted.
 * 3. A source pass changing filter retires both previous and newly produced
 *    attachments, leaving the restored renderer dirty for its next direct
 *    draw.
 * 4. Failed retirement keeps its original outcome without another disposal
 *    attempt; later scene passes, including another scene, request no draw.
 */
export function test_render_scene_render_scene_pass_shadow_target_lifecycle(): void {
  let draws: number = 0;
  const renderer: Renderer = rendererFacts((): void => {
    ++draws;
    directional.shadow.map = new THREE.WebGLRenderTarget(4, 4);
  });
  const empty: THREE.Scene = new THREE.Scene();
  empty.add(new THREE.Group(), new THREE.AmbientLight());
  AutoMovieSceneShadow.resetTargets(empty, renderer);
  const scene: THREE.Scene = new THREE.Scene(),
    directional: THREE.DirectionalLight = new THREE.DirectionalLight(),
    spot: THREE.SpotLight = new THREE.SpotLight();
  spot.visible = false;
  scene.add(directional, spot);
  const target: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(4, 4),
    depth: THREE.DepthTexture = new THREE.DepthTexture(4, 4),
    distribution: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(4, 4);
  target.depthTexture = depth;
  directional.shadow.map = target;
  spot.shadow.map = target;
  spot.shadow.mapPass = distribution;
  const disposed: [number, number, number] = [0, 0, 0];
  target.addEventListener("dispose", (): void => {
    disposed[0]++;
  });
  depth.addEventListener("dispose", (): void => {
    disposed[1]++;
  });
  distribution.addEventListener("dispose", (): void => {
    disposed[2]++;
  });
  AutoMovieSceneShadow.resetTargets(scene, renderer);
  TestValidator.equals(
    "shared and hidden products release once",
    disposed,
    [1, 1, 1],
  );
  TestValidator.equals(
    "public map slots clear and updates become dirty",
    [
      readShadowSlots(directional.shadow).map,
      readShadowSlots(spot.shadow).map,
      readShadowSlots(spot.shadow).mapPass,
      directional.shadow.needsUpdate,
      spot.shadow.needsUpdate,
    ],
    [null, null, null, true, true],
  );
  AutoMovieSceneShadow.resetTargets(scene, renderer);
  TestValidator.equals(
    "empty retained slots do not dispose twice",
    disposed,
    [1, 1, 1],
  );
  const failed: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(4, 4),
    later: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(4, 4),
    first: Error = new Error("first"),
    second: Error = new Error("second");
  const attempts: [number, number] = [0, 0];
  directional.shadow.map = failed;
  spot.shadow.map = later;
  failed.addEventListener("dispose", (): void => {
    attempts[0]++;
    throw first;
  });
  later.addEventListener("dispose", (): void => {
    attempts[1]++;
    throw second;
  });
  let caught: unknown;
  try {
    AutoMovieSceneShadow.resetTargets(scene, renderer);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "all independent disposal failures retained",
    caught instanceof AggregateError &&
      caught.errors[0] === first &&
      caught.errors[1] === second,
  );
  TestValidator.equals(
    "failed disposal still clears retired slots",
    [readShadowSlots(directional.shadow).map, readShadowSlots(spot.shadow).map],
    [null, null],
  );
  const repeated: ReturnType<typeof caughtFailure> = caughtFailure((): void =>
    AutoMovieSceneShadow.resetTargets(scene, renderer),
  );
  const refused: ReturnType<typeof caughtFailure> = caughtFailure((): void =>
    AutoMovieRenderScenePass.render(
      renderer,
      scene,
      new THREE.Camera(),
      undefined,
      "beauty",
    ),
  );
  TestValidator.predicate(
    "repeat and new pass preserve the exact original failure",
    repeated.threw &&
      refused.threw &&
      repeated.error === caught &&
      refused.error === caught,
  );
  const budget: ReturnType<typeof caughtFailure> = caughtFailure(
    (): ReturnType<typeof AutoMovieSceneShadow.readTextureTargets> =>
      AutoMovieSceneShadow.readTextureTargets("failed", renderer, new Map()),
  );
  TestValidator.predicate(
    "cleared public slots cannot certify a released budget after failure",
    budget.threw && budget.error === caught,
  );
  TestValidator.equals(
    "failed retirement prevents new draw requests",
    draws,
    0,
  );
  TestValidator.equals(
    "failed resources each receive one public disposal attempt",
    attempts,
    [1, 1],
  );
  const healthyRenderer: Renderer = rendererFacts((): void => {
    ++draws;
    directional.shadow.map = new THREE.WebGLRenderTarget(4, 4);
  });
  AutoMovieRenderScenePass.render(
    healthyRenderer,
    scene,
    new THREE.Camera(),
    {
      image: null,
      background: null,
      intensity: 1,
      rotationDeg: 0,
      exposure: 1,
      toneMapping: "none",
      shadows: { enabled: true, type: "vsm" },
    },
    "beauty",
  );
  TestValidator.equals(
    "restored filter has no incompatible retained map",
    [
      healthyRenderer.shadowMap.type,
      healthyRenderer.shadowMap.needsUpdate,
      readShadowSlots(directional.shadow).map,
    ],
    [THREE.PCFShadowMap, true, null],
  );
  let postAttempts: number = 0;
  const postRenderer: Renderer = rendererFacts((): void => {
    ++draws;
    const target: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(4, 4);
    target.addEventListener("dispose", (): void => {
      ++postAttempts;
      throw first;
    });
    directional.shadow.map = target;
    postRenderer.shadowMap.needsUpdate = false;
  });
  let restoreFailure: unknown;
  try {
    AutoMovieRenderScenePass.render(
      postRenderer,
      scene,
      new THREE.Camera(),
      {
        image: null,
        background: null,
        intensity: 1,
        rotationDeg: 0,
        exposure: 1,
        toneMapping: "none",
        shadows: { enabled: true, type: "vsm" },
      },
      "beauty",
    );
  } catch (error) {
    restoreFailure = error;
  }
  TestValidator.predicate(
    "failed target disposal retains failure",
    restoreFailure === first,
  );
  TestValidator.equals(
    "disposal failure cannot suppress renderer rebuild request",
    [
      postRenderer.shadowMap.needsUpdate,
      readShadowSlots(directional.shadow).map,
    ],
    [true, null],
  );
  const postRepeat: ReturnType<typeof caughtFailure> = caughtFailure((): void =>
    AutoMovieRenderScenePass.render(
      postRenderer,
      empty,
      new THREE.Camera(),
      undefined,
      "beauty",
    ),
  );
  TestValidator.predicate(
    "another scene cannot bypass failed context admission",
    postRepeat.threw && postRepeat.error === first,
  );
  TestValidator.equals(
    "failed final retirement requests no repeated draw or disposal",
    [draws, postAttempts],
    [2, 1],
  );
}
