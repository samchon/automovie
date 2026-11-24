import { respondAutoMovieFilmColor } from "@automovie/engine";
import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { AutoMovieFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * A film's EV100 maps photometric scene light to the delivered picture by the
 * ISO 12232 saturation-based scale, and the stage hands the final pass exactly
 * that scale after drawing the scene into a linear half-float target.
 *
 * Scenarios:
 *
 * 1. An 18 % grey Lambert card facing a 100000 lux light has luminance 0.18 ×
 *    100000 / π = 5729.6 nits; with `ev100: log2(40000)` and no curve the
 *    response is 1.055 × 0.1194^(1/2.4) − 0.055 = 0.3802, 97 of 255 within 2,
 *    in every channel.
 * 2. One stop more exposure (`ev100` one lower) doubles the linear value before
 *    encoding, so the card reads brighter: 0.2389 linear, encoded 0.5258.
 * 3. Drawn through the stage, the scene renders first into a half-float target at
 *    the drawn raster, then the full-frame pass renders into the host's canvas;
 *    the final pass's response matrix is the scale 1 / 48000 on its diagonal
 *    and zero elsewhere.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the engine's CPU reference of the response and the render stage over a recording renderer; a wrong exposure constant, a missing encoding, a scene drawn to the canvas or a final pass drawn into the linear target fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected values are the issue's hand computation from Lambert's law, the ISO 12232 scale `1 / (1.2 × 2^ev100)` and the IEC 61966-2-1 sRGB encoding; none is read from the implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Two exposures one stop apart and the stage's two draws; the renderer's own curve is owned by `test_draw_film_optics_owner`, absent optics by `test_draw_film_optics_absent`. The GPU program's pixels are not observed here; a real capture owns them.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_optics_exposure`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_optics_exposure(): void {
  const luminance: number = (0.18 * 100000) / Math.PI;
  const optics: IAutoMovieFilmOptics = {
    ev100: Math.log2(40000),
    toneMapping: "none",
  };

  // 1. The grey card.
  const card: [number, number, number] = respondAutoMovieFilmColor({
    color: [luminance, luminance, luminance],
    optics,
  });
  TestValidator.predicate(
    "the grey card encodes to 0.3802, 97 of 255",
    card.every(
      (value: number): boolean =>
        nclose(value, 0.3802, 5e-4) && Math.abs(value * 255 - 97) <= 2,
    ),
  );

  // 2. One stop brighter.
  const brighter: [number, number, number] = respondAutoMovieFilmColor({
    color: [luminance, luminance, luminance],
    optics: { ...optics, ev100: optics.ev100 - 1 },
  });
  TestValidator.predicate(
    "one stop more exposure doubles the linear value",
    brighter.every((value: number): boolean => nclose(value, 0.5258, 5e-4)),
  );

  // 3. The stage's two draws and its scale.
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
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
    seconds: 1,
    width: 64,
    height: 36,
  });
  const [linear, final]: createFilmResponseRendererDouble.IRender[] =
    double.renders;
  TestValidator.predicate(
    "the scene draws into a half-float target at the raster, then the response into the canvas",
    double.renders.length === 2 &&
      linear!.object === scene &&
      linear!.target !== null &&
      linear!.target.texture.type === THREE.HalfFloatType &&
      linear!.target.width === 64 &&
      linear!.target.height === 36 &&
      final!.object !== scene &&
      final!.target === null,
  );
  const response: number[] = (
    stage.final.uniforms.uResponse!.value as THREE.Matrix3
  )
    .clone()
    .transpose()
    .toArray();
  TestValidator.predicate(
    "the final pass scales by 1 / 48000",
    response.every((value: number, index: number): boolean =>
      nclose(value, index % 4 === 0 ? 1 / 48000 : 0, 1e-12),
    ),
  );
  stage.dispose();
}
