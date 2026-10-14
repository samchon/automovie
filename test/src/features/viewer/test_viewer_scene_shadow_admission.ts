import {
  assertAutoMovieSceneShadowProfile,
  readAutoMovieShadowLightSource,
  renderAutoMovieScenePass,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Scene-pass admission reaches the same point/VSM refusal as an authored scene before policy writes or the supplied draw callback is requested.
 *
 * Scenarios:
 * 1. Casting point VSM refuses, including hidden lights, while adjacent PCF, disabled VSM and noncasting point VSM remain supported.
 * 2. Directional, spot and non-shadow light populations retain supported VSM.
 * 3. Scene-owned and inherited host VSM refuse before changing host state; structural guides bypass shadows and restore the original policy.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs scene shadow admission and the actual scene-pass coordinator with existing native light objects and the supplied policy port; catches point/VSM refusal occurring after policy mutation or a draw request.
 * @evidence contracts/testing.md#independent-expectations The supported point/VSM restriction defines refusal, original renderer fields define preflight preservation, and structural guides disable shadows then restore policy. Recorded draw requests are not native shadow allocations or rendered pixels.
 * @evidence contracts/testing.md#distinguishing-cases Covers hidden casting points, PCF, disabled/noncasting VSM, directional/spot/non-shadow lights, scene-owned/inherited VSM and structural bypass; actual shadow target retirement has its own lifecycle tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit uses actual CPU-side Three lights/scene and the existing narrow local renderer policy port through maintained source, with no browser, GPU context, process or new driver.
 */
export function test_viewer_scene_shadow_admission(): void {
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene(),
    point: THREE.PointLight = new THREE.PointLight();
  point.name = "point-caster";
  point.castShadow = true;
  point.visible = false;
  scene.add(point, new THREE.AmbientLight(), new THREE.Group());
  let refused: unknown;
  try {
    assertAutoMovieSceneShadowProfile(scene, { enabled: true, type: "vsm" });
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "casting point refuses with runtime identity",
    refused instanceof Error &&
      refused.message.includes("point-caster") &&
      refused.message.includes("castShadow"),
  );
  assertAutoMovieSceneShadowProfile(scene, { enabled: true, type: "pcf" });
  assertAutoMovieSceneShadowProfile(scene, { enabled: false, type: "vsm" });
  point.castShadow = false;
  assertAutoMovieSceneShadowProfile(scene, { enabled: true, type: "vsm" });
  const directional: THREE.DirectionalLight = new THREE.DirectionalLight(),
    spot: THREE.SpotLight = new THREE.SpotLight();
  directional.castShadow = true;
  spot.castShadow = true;
  scene.add(directional, spot);
  assertAutoMovieSceneShadowProfile(scene, { enabled: true, type: "vsm" });
  TestValidator.equals(
    "native punctual projection preserves supplied identity and casting",
    [
      readAutoMovieShadowLightSource("p", point),
      readAutoMovieShadowLightSource("d", directional),
      readAutoMovieShadowLightSource("s", spot),
      readAutoMovieShadowLightSource("a", new THREE.AmbientLight()),
      readAutoMovieShadowLightSource("g", new THREE.Group()),
    ],
    [
      { id: "p", type: "point", castShadow: false },
      { id: "d", type: "directional", castShadow: true },
      { id: "s", type: "spot", castShadow: true },
      null,
      null,
    ],
  );
  point.name = "";
  point.castShadow = true;
  let draws: number = 0;
  const renderer: THREE.WebGLRenderer = {
    getRenderTarget: (): null => null,
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    shadowMap: { enabled: true, type: THREE.PCFShadowMap, needsUpdate: false },
    render: (): void => {
      draws++;
    },
  } as unknown as THREE.WebGLRenderer;
  const environment: {
    image: null;
    background: null;
    intensity: number;
    rotationDeg: number;
    exposure: number;
    toneMapping: "acesFilmic";
    shadows: { enabled: boolean; type: "vsm" };
  } = {
    image: null,
    background: null,
    intensity: 1,
    rotationDeg: 0,
    exposure: 1.5,
    toneMapping: "acesFilmic" as const,
    shadows: { enabled: true, type: "vsm" as const },
  };
  let failed: boolean = false;
  try {
    renderAutoMovieScenePass(
      renderer,
      scene,
      new THREE.Camera(),
      environment,
      "beauty",
    );
  } catch {
    failed = true;
  }
  TestValidator.predicate(
    "refusal precedes renderer state and draw",
    failed &&
      draws === 0 &&
      renderer.toneMapping === THREE.NoToneMapping &&
      nclose(renderer.toneMappingExposure, 1, 0) &&
      renderer.shadowMap.type === THREE.PCFShadowMap,
  );
  renderer.shadowMap.type = THREE.VSMShadowMap;
  failed = false;
  try {
    renderAutoMovieScenePass(
      renderer,
      scene,
      new THREE.Camera(),
      undefined,
      "beauty",
    );
  } catch {
    failed = true;
  }
  TestValidator.predicate(
    "inherited host VSM shares admission",
    failed && draws === 0,
  );
  renderAutoMovieScenePass(
    renderer,
    scene,
    new THREE.Camera(),
    environment,
    "normal",
  );
  TestValidator.equals(
    "structural bypass draws and restores",
    [draws, renderer.shadowMap.enabled, renderer.shadowMap.type],
    [1, true, THREE.VSMShadowMap],
  );
}
