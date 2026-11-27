import { AutoMovieRenderSceneEnvironment } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `applySceneFog` installs exponential fog of a colour or clears it.
 *
 * Scenarios:
 *
 * 1. A fog of colour (0.25, 0.5, 0.75) sets the scene's fog to that colour.
 * 2. `null` and `undefined` clear it.
 */
export function test_render_scene_apply_scene_fog(): void {
  const scene: THREE.Scene = new THREE.Scene();
  AutoMovieRenderSceneEnvironment.applySceneFog(scene, {
    density: 0.1,
    color: { r: 0.25, g: 0.5, b: 0.75, a: null, hex: null },
  });
  TestValidator.equals("colour", scene.fog?.color.toArray(), [0.25, 0.5, 0.75]);
  AutoMovieRenderSceneEnvironment.applySceneFog(scene, null);
  TestValidator.equals("null", scene.fog, null);
  AutoMovieRenderSceneEnvironment.applySceneFog(scene, {
    density: 0.1,
    color: { r: 0, g: 0, b: 0, a: null, hex: null },
  });
  AutoMovieRenderSceneEnvironment.applySceneFog(scene, undefined);
  TestValidator.equals("undefined", scene.fog, null);
}