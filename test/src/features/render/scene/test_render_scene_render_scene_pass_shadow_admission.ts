import { type IAutoMovieRenderScenePassRenderer, AutoMovieRenderScenePass, AutoMovieRenderSceneShadow } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createScenePassRendererDouble } from "../../internal/createScenePassRendererDouble";
import { nclose } from "../../internal/predicates";

/**
 * Scene-pass admission reaches the same point/VSM refusal as an authored scene
 * before policy writes or the supplied draw callback is requested.
 *
 * Scenarios:
 *
 * 1. Casting point VSM refuses, including hidden lights, while adjacent PCF,
 *    disabled VSM and noncasting point VSM remain supported.
 * 2. Directional, spot and non-shadow light populations retain supported VSM.
 * 3. Scene-owned and inherited host VSM refuse before changing host state;
 *    structural guides bypass shadows and restore the original policy.
 */
export function test_render_scene_render_scene_pass_shadow_admission(): void {
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene(),
    point: THREE.PointLight = new THREE.PointLight();
  point.name = "point-caster";
  point.castShadow = true;
  point.visible = false;
  scene.add(point, new THREE.AmbientLight(), new THREE.Group());
  let refused: unknown;
  try {
    AutoMovieRenderSceneShadow.assertProfile(scene, { enabled: true, type: "vsm" });
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "casting point refuses with runtime identity",
    refused instanceof Error &&
      refused.message.includes("point-caster") &&
      refused.message.includes("castShadow"),
  );
  AutoMovieRenderSceneShadow.assertProfile(scene, { enabled: true, type: "pcf" });
  AutoMovieRenderSceneShadow.assertProfile(scene, { enabled: false, type: "vsm" });
  point.castShadow = false;
  AutoMovieRenderSceneShadow.assertProfile(scene, { enabled: true, type: "vsm" });
  const directional: THREE.DirectionalLight = new THREE.DirectionalLight(),
    spot: THREE.SpotLight = new THREE.SpotLight();
  directional.castShadow = true;
  spot.castShadow = true;
  scene.add(directional, spot);
  AutoMovieRenderSceneShadow.assertProfile(scene, { enabled: true, type: "vsm" });
  TestValidator.equals(
    "native punctual projection preserves supplied identity and casting",
    [
      AutoMovieRenderSceneShadow.readLightSource("p", point),
      AutoMovieRenderSceneShadow.readLightSource("d", directional),
      AutoMovieRenderSceneShadow.readLightSource("s", spot),
      AutoMovieRenderSceneShadow.readLightSource("a", new THREE.AmbientLight()),
      AutoMovieRenderSceneShadow.readLightSource("g", new THREE.Group()),
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
  const renderer: IAutoMovieRenderScenePassRenderer = createScenePassRendererDouble(
    (): void => {
      draws++;
    },
  );
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
    AutoMovieRenderScenePass.render(
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
    AutoMovieRenderScenePass.render(
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
  AutoMovieRenderScenePass.render(
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
