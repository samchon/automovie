import type { IAutoMovieFilmShading } from "@automovie/interface";
import {
  AutoMovieFilmIndirectStage,
  type IAutoMovieFilmIndirectRenderer,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createProbeRendererDouble } from "./createProbeRendererDouble";

/**
 * The probe bake draws the static layer without the scene's background, so a
 * sky that image lighting already brings to every material is not counted a
 * second time, and the beauty frame afterwards still shows its background.
 *
 * The scene carries a uniform environment image as both `scene.environment` and
 * `scene.background`, as `applySceneEnvironment` sets them. The renderer is a
 * recording double whose read-back returns black, which is what a cube of an
 * empty layer sees once the background is off.
 *
 * Scenarios:
 *
 * 1. Every bake render runs with the scene's background null, after a clear to
 *    black with alpha zero, through a camera that sees `layer` alone; there are
 *    twelve per probe (six faces, then six back-face checks), and each probe is
 *    read back twice.
 * 2. With the empty layer reading black, every baked coefficient is zero, so the
 *    probes add zero irradiance for every receiver direction, and every probe
 *    is valid.
 * 3. The beauty callback afterwards sees the environment as the scene's background
 *    again, the renderer's clear colour and alpha are restored, and the probe
 *    term is on only inside the callback.
 * 4. Probes without optics are refused naming `optics`, and a renderer that cannot
 *    read back refuses the bake.
 *
 * Whether a real floor's upward receiver stays at or below 50 lux under the sky
 * is checked on a real GPU under the visual-debugging skill.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the stage over a recording renderer and reads the baked texture; a bake that drew the background, left it off afterwards or saw other layers fails.
 * @evidence contracts/development/testing.md#independent-expectations The issue fixes the rule: no background in the cube, black clear, the static layer alone; black texels project to zero coefficients by linearity.
 * @evidence contracts/development/testing.md#distinguishing-cases During the bake against inside the beauty pass and after it; with and without optics; a renderer without read-back. The projection's arithmetic is owned by `test_draw_film_probes_floor`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_probes_background`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_probes_background(): void {
  const sky: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1,
    1,
  );
  const scene: THREE.Scene = new THREE.Scene();
  scene.environment = sky;
  scene.background = sky;
  scene.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
  );
  const double: createProbeRendererDouble.IDouble = createProbeRendererDouble({
    texel: (): number => 0,
  });
  double.renderer.setClearColor!(0x336699, 1);
  const stage: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
  let seen: { background: unknown; on: number } | null = null;
  stage.draw(
    {
      renderer: double.renderer,
      scene,
      camera: new THREE.PerspectiveCamera(),
      shading: {
        probes: {
          min: { x: 0, y: 1, z: 0 },
          max: { x: 1, y: 1, z: 0 },
          spacing: 1,
          layer: 3,
          revision: "night",
        },
      },
      optics: true,
      seconds: 4,
      width: 32,
      height: 18,
      sample: 0,
    },
    (): void => {
      seen = {
        background: scene.background,
        on: stage.uniforms.uFilmProbesOn!.value as number,
      };
    },
  );

  // 1. Bake renders.
  TestValidator.predicate(
    `two probes bake 24 renders without background on layer 3 alone (${double.renders.length})`,
    double.renders.length === 24 &&
      double.renders.every(
        (render: { background: unknown; cameraMask: number }): boolean =>
          render.background === null && render.cameraMask === 1 << 3,
      ) &&
      double.clears.length === 4 &&
      double.clears.every(
        (clear: createProbeRendererDouble.IClear): boolean =>
          clear.color === 0 && clear.alpha === 0,
      ) &&
      double.reads() === 4,
  );

  // 2. Zero irradiance.
  const data: Float32Array = (
    stage.uniforms.uFilmProbes!.value as THREE.DataTexture
  ).image.data as Float32Array;
  TestValidator.predicate(
    "an empty layer bakes zero coefficients and valid probes",
    Array.from(data).every((value: number, index: number): boolean =>
      index % 4 === 3 ? value === (index % 36 === 3 ? 1 : 0) : value === 0,
    ),
  );

  // 3. Restored.
  const clear: THREE.Color = double.renderer.getClearColor!(new THREE.Color());
  TestValidator.predicate(
    "the beauty pass sees the sky again and the clear colour is restored",
    seen !== null &&
      (seen as { background: unknown; on: number }).background === sky &&
      (seen as { background: unknown; on: number }).on === 1 &&
      stage.uniforms.uFilmProbesOn!.value === 0 &&
      clear.getHex() === 0x336699 &&
      double.renderer.getClearAlpha!() === 1,
  );

  // 4. Refusals.
  const refused: (run: () => void) => string = (run: () => void): string => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof Error ? error.message : String(error);
    }
    return "";
  };
  const probes: IAutoMovieFilmShading.IProbes = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 },
    spacing: 1,
    layer: 2,
    revision: "a",
  };
  const draw: (
    renderer: IAutoMovieFilmIndirectRenderer,
    optics: boolean,
  ) => void = (
    renderer: IAutoMovieFilmIndirectRenderer,
    optics: boolean,
  ): void =>
    new AutoMovieFilmIndirectStage().draw(
      {
        renderer,
        scene,
        camera: new THREE.PerspectiveCamera(),
        shading: { probes },
        optics,
        seconds: 7,
        width: 8,
        height: 8,
        sample: 0,
      },
      (): void => {},
    );
  const plain: createProbeRendererDouble.IDouble = createProbeRendererDouble({
    texel: (): number => 0,
  });
  delete plain.renderer.readRenderTargetPixels;
  TestValidator.predicate(
    "probes without optics, or without read-back, are refused",
    refused(() =>
      draw(
        createProbeRendererDouble({ texel: (): number => 0 }).renderer,
        false,
      ),
    ).includes("optics") &&
      refused(() => draw(plain.renderer, true)).includes("read back"),
  );
  stage.dispose();
}
