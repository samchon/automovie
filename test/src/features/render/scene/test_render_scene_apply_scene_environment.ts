import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import { AutoMovieRenderThreeKind, AutoMovieRenderSceneEnvironment } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  Scene,
  Texture,
} from "three";

import { nclose } from "../../internal/nclose";

/** One product and division near pi/2 bound the angle error to two ulps. */
const ROTATION_TOLERANCE: number = 2 * Number.EPSILON;

/** The linear colour and intensity are exact binary fractions. */
const COLOR_TOLERANCE: number = 0;

/**
 * Scene environment publication selects the decoded texture or its fallback and
 * sets the common background and lighting orientation.
 *
 * Scenarios:
 *
 * 1. Without decoded bytes the environment is absent and the explicit linear
 *    background is visible. Ninety degrees becomes pi/2 on the world Y axis.
 * 2. An unsigned-byte texture supplies both environment and background. A repeated
 *    call with its unchanged mapping does not retire or upload again.
 * 3. Clearing the environment removes both published references.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names linear fallback, shared environment and background texture, rotation, reuse and clearing.
 * @evidence contracts/development/testing.md#behavioral-verification Publishes a typed environment on a real Three.js scene before loading a texture, with its decoded texture and again with the same mapping. Reads both native references, rotations and upload changes, then clears it.
 * @evidence contracts/development/testing.md#independent-expectations A 90-degree yaw becomes π/2 on the Y axis. Before decode, the specified fallback supplies color and environment is absent. Once decoded, the same supplied texture appears in both references, with no further upload for identical publication. Clearing removes both.
 */
export function test_render_scene_apply_scene_environment(): void {
  const scene: Scene = new Scene();
  const environment: IAutoMovieSceneEnvironment = {
    image: "room",
    background: { r: 0.25, g: 0.5, b: 0.75, a: null, hex: null },
    intensity: 2,
    rotationDeg: 90,
    exposure: 1,
    toneMapping: "none",
    shadows: { enabled: false, type: "pcf" },
  };
  AutoMovieRenderSceneEnvironment.applySceneEnvironment(scene, environment);
  const fallback: Scene["background"] = scene.background;
  TestValidator.predicate(
    "fallback is the declared linear colour",
    () =>
      scene.environment === null &&
      fallback !== null &&
      AutoMovieRenderThreeKind.isColor(fallback) &&
      nclose(fallback.r, 0.25, COLOR_TOLERANCE) &&
      nclose(fallback.g, 0.5, COLOR_TOLERANCE) &&
      nclose(fallback.b, 0.75, COLOR_TOLERANCE),
  );
  TestValidator.predicate(
    "the two rotations use radians about Y",
    () =>
      nclose(scene.environmentRotation.y, Math.PI / 2, ROTATION_TOLERANCE) &&
      nclose(scene.backgroundRotation.y, Math.PI / 2, ROTATION_TOLERANCE) &&
      nclose(scene.environmentIntensity, 2, COLOR_TOLERANCE),
  );

  const texture: Texture = new Texture();
  const retired: Texture[] = [];
  texture.addEventListener("dispose", (): void => {
    retired.push(texture);
  });
  AutoMovieRenderSceneEnvironment.applySceneEnvironment(scene, environment, texture);
  TestValidator.predicate(
    "image is prepared and shared by both bindings",
    () =>
      scene.environment === texture &&
      scene.background === texture &&
      texture.mapping === EquirectangularReflectionMapping &&
      texture.colorSpace === SRGBColorSpace,
  );
  const uploadVersion: number = texture.version;
  AutoMovieRenderSceneEnvironment.applySceneEnvironment(scene, environment, texture);
  TestValidator.equals(
    "one reconfiguration and one upload version",
    [retired.length, uploadVersion, texture.version],
    [1, 1, 1],
  );

  AutoMovieRenderSceneEnvironment.applySceneEnvironment(scene, null);
  TestValidator.equals(
    "cleared image bindings",
    [scene.environment, scene.background],
    [null, null],
  );
}
