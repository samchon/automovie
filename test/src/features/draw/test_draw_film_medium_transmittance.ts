import type { IAutoMovieFilmOptics } from "@automovie/interface";
import {
  AutoMovieFilmResponseStage,
  applySceneMedium,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";
import { locateFilmPixel } from "./locateFilmPixel";
import { marchFilmMediumPixel } from "./marchFilmMediumPixel";

/**
 * Without light, a medium only absorbs: the surface keeps `exp(−σt × s)` of its
 * radiance over its distance `s` along the view ray.
 *
 * Scenarios:
 *
 * 1. With `scattering: 0`, `absorption: 0.1` and no light, a white wall 10 m in
 *    front of the camera keeps `exp(−1) = 0.3679` of its radiance at the centre
 *    pixel, within 1 %, and the picture stays opaque.
 * 2. Near the frame's corner the same wall lies farther along the ray, `10 / cos
 *    α` with `α` the ray's angle off the axis, and keeps `exp(−0.1 × 10 / cos
 *    α)`, within 1 %: the march attenuates along the ray, not by depth.
 * 3. A transparent pixel, alpha 0 with no surface behind it, gains the medium's
 *    opacity `1 − T` for the far plane's distance.
 *
 * The values come from the CPU reference of the 64-step march, fed the uniforms
 * the medium pass handed its program for this scene and camera; the GPU
 * program's own pixels are a capture's to read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the medium, the wall and each pixel's expected transmittance, and the reference's limit.
 * @evidence contracts/development/testing.md#behavioral-verification Draws the scene through the film response stage over a recording renderer, takes the march program's recorded uniforms and evaluates the march for chosen pixels; an extinction that drops the absorption, an eye or camera matrix that misplaces the ray, or a march by depth rather than distance fails.
 * @evidence contracts/development/testing.md#independent-expectations Beer-Lambert extinction over the ray's length, issue #4084's `exp(−1)` case, with the corner distance from the wall's plane and the ray's angle computed here.
 * @evidence contracts/development/testing.md#distinguishing-cases The centre and a corner pixel of one wall and a transparent pixel; in-scattering belongs to test_draw_film_medium_inscatter and shadows to test_draw_film_medium_shadow, the pass order to test_draw_film_medium_order. The reference states the program's method, so the GPU arithmetic is the capture's oracle, not this test's.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over a recording renderer and a CPU reference; no GPU starts.
 */
export function test_draw_film_medium_transmittance(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const wall: THREE.Mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial(),
  );
  wall.position.set(0, 0, -10);
  scene.add(wall);
  applySceneMedium(scene, { scattering: 0, absorption: 0.1, anisotropy: 0 });
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    40,
    16 / 9,
    0.1,
    50,
  );
  const width: number = 64;
  const height: number = 36;
  const optics: IAutoMovieFilmOptics = { ev100: 0, toneMapping: "none" };
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  stage.draw({
    renderer: double.renderer,
    scene,
    camera,
    optics,
    seconds: 0,
    width,
    height,
  });
  const program: Record<string, unknown> = double.renders[1]!.program!;
  const march: (
    toward: THREE.Vector3,
    color: readonly [number, number, number, number],
  ) => { value: number[]; along: number } = (
    toward: THREE.Vector3,
    color: readonly [number, number, number, number],
  ): { value: number[]; along: number } => {
    const at: ReturnType<typeof locateFilmPixel> = locateFilmPixel({
      camera,
      scene,
      width,
      height,
      toward,
    });
    // The wall's distance along the pixel's own ray, from its angle off the axis.
    const ray: THREE.Vector3 = new THREE.Vector3(
      at.uv.x * 2 - 1,
      at.uv.y * 2 - 1,
      0.5,
    )
      .unproject(camera)
      .normalize();
    return {
      value: marchFilmMediumPixel({ program, kinds: [], ...at, color }),
      along: 10 / -ray.z,
    };
  };

  // 1. The centre pixel.
  const centre: { value: number[]; along: number } = march(
    new THREE.Vector3(0, 0, -10),
    [1, 1, 1, 1],
  );
  TestValidator.predicate(
    `the wall keeps exp(−1) of its radiance (${centre.value[0]!.toFixed(4)})`,
    Math.abs(centre.value[0]! / Math.exp(-1) - 1) <= 0.01 &&
      centre.value[3] === 1,
  );

  // 2. A corner pixel, farther along its ray.
  const corner: { value: number[]; along: number } = march(
    new THREE.Vector3(-4.5, 3, -10),
    [1, 1, 1, 1],
  );
  TestValidator.predicate(
    `a corner keeps exp(−0.1 × ${corner.along.toFixed(3)} m) (${corner.value[0]!.toFixed(4)})`,
    corner.along > 10.5 &&
      Math.abs(corner.value[0]! / Math.exp(-0.1 * corner.along) - 1) <= 0.01,
  );

  // 3. A transparent pixel gains the medium's opacity.
  scene.remove(wall);
  const clear: { value: number[]; along: number } = march(
    new THREE.Vector3(0, 0, -10),
    [0, 0, 0, 0],
  );
  TestValidator.predicate(
    `a transparent pixel takes the opacity 1 − T over the far plane (${clear.value[3]!.toFixed(4)})`,
    Math.abs(clear.value[3]! - (1 - Math.exp(-0.1 * 50))) <= 0.01,
  );
  stage.dispose();
}
