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
 * A lit medium scatters the light toward the camera: in front of a black
 * surface the pixel shows only the single-scattered light, `(σs / σt) × p(θ) ×
 * E × (1 − exp(−σt × d))` for a uniform illuminance `E`.
 *
 * Scenarios:
 *
 * 1. One 1000 lux directional light shining straight down, perpendicular to the
 *    view ray, with `anisotropy: 0`, `scattering: 0.05`, `absorption: 0` and a
 *    black wall 10 m away, gives the centre pixel (σs / σt) × (E / 4π) × (1 −
 *    exp(−σt × d)) = 79.58 × 0.3935 = 31.31 nits, within 2 %, in every
 *    channel.
 * 2. With `anisotropy: 0.6` the same right-angle scattering takes the
 *    Henyey-Greenstein weight `(1 − g²) / (4π (1 + g²)^1.5)` in place of `1 /
 *    4π`, 12.63 nits within 2 %.
 * 3. With `absorption: 0.05` beside `scattering: 0.05`, the albedo σs / σt halves
 *    and the path's extinction doubles: 79.58 × 0.5 × (1 − exp(−1)), 25.15 nits
 *    within 2 %.
 * 4. The light's colour weights its channels: a light of linear colour (1, 0.5,
 *    0.25) gives the isotropic pixel 31.31 × (1, 0.5, 0.25) within 2 %.
 *
 * The values come from the CPU reference of the 64-step march, fed the uniforms
 * the medium pass handed its program for each scene; the GPU program's own
 * pixels are a capture's to read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the light, each medium and the expected pixel, and the reference's limit.
 * @evidence contracts/development/testing.md#behavioral-verification Draws through the film response stage over a recording renderer, takes the march program's recorded light, camera and medium uniforms and evaluates the march; a light colour not scaled by its intensity, a direction reversed or dropped, an extinction or scattering read wrongly or a phase function off its normalization fails.
 * @evidence contracts/development/testing.md#independent-expectations Issue #4084's 31.31 nits case of the single-scattering integral (Max 1995) with the Henyey-Greenstein phase function (Henyey and Greenstein 1941), each value computed here in closed form.
 * @evidence contracts/development/testing.md#distinguishing-cases Isotropic and forward-scattering media, a pure scatterer and an absorbing one, a white and a coloured light. Extinction alone belongs to test_draw_film_medium_transmittance, shadows to test_draw_film_medium_shadow. The reference states the program's method, so the GPU arithmetic is the capture's oracle, not this test's.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over a recording renderer and a CPU reference; no GPU starts.
 */
export function test_draw_film_medium_inscatter(): void {
  const width: number = 64;
  const height: number = 36;
  const optics: IAutoMovieFilmOptics = { ev100: 0, toneMapping: "none" };
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    40,
    16 / 9,
    0.1,
    50,
  );
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const pixel: (props: {
    color: THREE.Color;
    scattering: number;
    absorption: number;
    anisotropy: number;
  }) => number[] = (props: {
    color: THREE.Color;
    scattering: number;
    absorption: number;
    anisotropy: number;
  }): number[] => {
    const scene: THREE.Scene = new THREE.Scene();
    const wall: THREE.Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    );
    wall.position.set(0, 0, -10);
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(
      props.color,
      1000,
    );
    sun.position.set(0, 20, -5);
    sun.target.position.set(0, 0, -5);
    scene.add(wall, sun, sun.target);
    applySceneMedium(scene, {
      scattering: props.scattering,
      absorption: props.absorption,
      anisotropy: props.anisotropy,
    });
    const double: createFilmResponseRendererDouble.IDouble =
      createFilmResponseRendererDouble({
        toneMapping: THREE.NoToneMapping,
        exposure: 1,
      });
    stage.draw({
      renderer: double.renderer,
      scene,
      camera,
      optics,
      seconds: 0,
      width,
      height,
    });
    const at: ReturnType<typeof locateFilmPixel> = locateFilmPixel({
      camera,
      scene,
      width,
      height,
      toward: new THREE.Vector3(0, 0, -10),
    });
    return marchFilmMediumPixel({
      program: double.renders[1]!.program!,
      kinds: ["directional"],
      ...at,
      color: [0, 0, 0, 1],
    });
  };
  const white: THREE.Color = new THREE.Color(1, 1, 1);
  const within: (value: number, expected: number) => boolean = (
    value: number,
    expected: number,
  ): boolean => Math.abs(value / expected - 1) <= 0.02;

  // 1. The isotropic case of the issue.
  const isotropic: number[] = pixel({
    color: white,
    scattering: 0.05,
    absorption: 0,
    anisotropy: 0,
  });
  const expected: number = (1000 / (4 * Math.PI)) * (1 - Math.exp(-0.5));
  TestValidator.predicate(
    `the pixel shows ${expected.toFixed(2)} nits of scattered light (${isotropic[0]!.toFixed(2)})`,
    [0, 1, 2].every((c: number): boolean => within(isotropic[c]!, expected)),
  );

  // 2. Forward scattering seen at a right angle.
  const g: number = 0.6;
  const forward: number[] = pixel({
    color: white,
    scattering: 0.05,
    absorption: 0,
    anisotropy: g,
  });
  const weight: number = (1 - g * g) / (4 * Math.PI * (1 + g * g) ** 1.5);
  TestValidator.predicate(
    `a forward-scattering medium scatters ${(1000 * weight * (1 - Math.exp(-0.5))).toFixed(2)} nits sideways (${forward[0]!.toFixed(2)})`,
    within(forward[0]!, 1000 * weight * (1 - Math.exp(-0.5))),
  );

  // 3. An absorbing medium.
  const absorbing: number[] = pixel({
    color: white,
    scattering: 0.05,
    absorption: 0.05,
    anisotropy: 0,
  });
  TestValidator.predicate(
    `absorption halves the albedo and doubles the extinction (${absorbing[0]!.toFixed(2)})`,
    within(absorbing[0]!, (1000 / (4 * Math.PI)) * 0.5 * (1 - Math.exp(-1))),
  );

  // 4. A coloured light.
  const coloured: number[] = pixel({
    color: new THREE.Color(1, 0.5, 0.25),
    scattering: 0.05,
    absorption: 0,
    anisotropy: 0,
  });
  TestValidator.predicate(
    "the light's colour weights each channel",
    within(coloured[0]!, expected) &&
      within(coloured[1]!, 0.5 * expected) &&
      within(coloured[2]!, 0.25 * expected),
  );
  stage.dispose();
}
