import type { IAutoMovieLight } from "@automovie/interface";
import { applyLightMotion } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `applyLightMotion` writes each resolved light's state onto its three.js
 * light.
 *
 * Scenarios:
 *
 * 1. A point light with no clip is written to the light its id resolves to:
 *    position, colour, intensity and range.
 * 2. A light whose id resolves to nothing is skipped without an error.
 */
export function test_render_scene_apply_light_motion(): void {
  const light: IAutoMovieLight = {
    id: "lamp",
    type: "point",
    transform: {
      translation: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { r: 0.25, g: 0.5, b: 0.75, a: null, hex: null },
    intensity: 7,
    range: 12,
  };
  const target: THREE.PointLight = new THREE.PointLight();
  applyLightMotion([light], [], 0, (id: string): THREE.Light | undefined =>
    id === "lamp" ? target : undefined,
  );
  TestValidator.equals("position", target.position.toArray(), [1, 2, 3]);
  TestValidator.equals("color", target.color.toArray(), [0.25, 0.5, 0.75]);
  TestValidator.equals("intensity and range", [target.intensity, target.distance], [7, 12]);

  const other: THREE.PointLight = new THREE.PointLight();
  applyLightMotion([light], [], 0, (): THREE.Light | undefined => undefined);
  TestValidator.equals("untouched", other.intensity, 1);
}