import type { IAutoMovieFilmOptics } from "@automovie/interface";
import {
  AutoMovieFilmResponseStage,
  applySceneMedium,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/nclose";
import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * The medium is marched over each linear render right after the scene is drawn
 * and before the response, from this draw's own camera and lights, so the same
 * second drawn twice, or after a different second, marches the same.
 *
 * Scenarios:
 *
 * 1. One draw with optics renders, in order, the scene into the linear target, the
 *    march into its own target with the medium's scattering and extinction and
 *    a zero dither shift, the copy of the march back over the linear target
 *    without a clear, and the response into the host's target.
 * 2. Drawing second A, then a second B with another camera and light position,
 *    then A again, gives A's two marches the same eye, camera, light and shift
 *    uniforms, while B's differ, so nothing of B carries into the second A.
 * 3. Three accumulated samples march after each sample's render and before its
 *    addition to the sum, with dither shifts 0, 0.618 and 0.236, the golden
 *    ratio's conjugate times the index modulo one.
 * 4. The same scene without a medium renders the scene and the response only.
 *
 * Transmittance, in-scatter and the shadowed beam are pixel values a recording
 * renderer cannot produce; they are measured on a real GPU under the
 * visual-debugging skill.
 */
export function test_unit_render_draw_film_medium_order(): void {
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
  );
  const lamp: THREE.SpotLight = new THREE.SpotLight(0xffffff, 100);
  scene.add(lamp, lamp.target);
  applySceneMedium(scene, {
    scattering: 0.05,
    absorption: 0.02,
    anisotropy: 0.3,
  });
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    40,
    16 / 9,
    0.1,
    100,
  );
  const optics: IAutoMovieFilmOptics = { ev100: 6, toneMapping: "none" };
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const record: () => createFilmResponseRendererDouble.IDouble =
    (): createFilmResponseRendererDouble.IDouble =>
      createFilmResponseRendererDouble({
        toneMapping: THREE.NoToneMapping,
        exposure: 1,
      });
  const place: (z: number, light: number) => void = (
    z: number,
    light: number,
  ): void => {
    camera.position.set(0, 1, z);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    lamp.position.set(light, 3, 0);
    scene.updateMatrixWorld(true);
  };
  const drawOnce: () => createFilmResponseRendererDouble.IRender[] =
    (): createFilmResponseRendererDouble.IRender[] => {
      const double: createFilmResponseRendererDouble.IDouble = record();
      stage.draw({
        renderer: double.renderer,
        scene,
        camera,
        optics,
        seconds: 1,
        width: 64,
        height: 36,
      });
      return double.renders;
    };
  const march: (
    renders: createFilmResponseRendererDouble.IRender[],
  ) => string = (
    renders: createFilmResponseRendererDouble.IRender[],
  ): string => {
    const program: Record<string, unknown> | null = renders[1]?.program ?? null;
    return JSON.stringify(
      program === null
        ? null
        : [
            program.uEye,
            program.uCameraWorld,
            program.uPosition0,
            program.uDirection0,
            program.uShift,
          ],
    );
  };

  // 1. The order of one draw.
  place(5, -2);
  const first: createFilmResponseRendererDouble.IRender[] = drawOnce();
  const [
    linear,
    marched,
    copied,
    response,
  ]: createFilmResponseRendererDouble.IRender[] = first;
  const program: Record<string, unknown> | null = marched?.program ?? null;
  TestValidator.predicate(
    "scene, march, copy over the linear target, then the response",
    first.length === 4 &&
      linear!.object === scene &&
      linear!.target !== null &&
      marched!.object !== scene &&
      marched!.target !== null &&
      marched!.target !== linear!.target &&
      program !== null &&
      nclose(program.uScattering as number, 0.05) &&
      nclose(program.uExtinction as number, 0.07) &&
      program.uShift === 0 &&
      copied!.target === linear!.target &&
      copied!.autoClear === false &&
      response!.object !== scene &&
      response!.target === null,
  );

  // 2. A, B, A.
  place(8, 3);
  const other: createFilmResponseRendererDouble.IRender[] = drawOnce();
  place(5, -2);
  const again: createFilmResponseRendererDouble.IRender[] = drawOnce();
  TestValidator.predicate(
    "the second A marches as the first, unaffected by B",
    march(again) === march(first) && march(other) !== march(first),
  );

  // 3. Accumulated samples.
  const double: createFilmResponseRendererDouble.IDouble = record();
  for (let index: number = 0; index < 3; ++index)
    stage.accumulate({
      renderer: double.renderer,
      scene,
      camera,
      optics: { ...optics, shutter: { angle: 180 }, samples: 3 },
      seconds: 1,
      width: 64,
      height: 36,
      index,
      count: 3,
    });
  const golden: number = (Math.sqrt(5) - 1) / 2;
  const shifts: number[] = double.renders
    .filter(
      (render: createFilmResponseRendererDouble.IRender, at: number): boolean =>
        render.program?.uShift !== undefined &&
        double.renders[at - 1]?.object === scene,
    )
    .map(
      (render: createFilmResponseRendererDouble.IRender): number =>
        render.program!.uShift as number,
    );
  TestValidator.predicate(
    "each accumulated sample is marched after its render with its own shift",
    shifts.length === 3 &&
      [0, 1, 2].every((k: number): boolean =>
        nclose(shifts[k]!, (k * golden) % 1),
      ),
  );

  // 4. Clear air.
  applySceneMedium(scene, null);
  const clear: createFilmResponseRendererDouble.IRender[] = drawOnce();
  TestValidator.predicate(
    "without a medium only the scene and the response render",
    clear.length === 2 &&
      clear[0]!.object === scene &&
      clear[1]!.target === null,
  );
  stage.dispose();
}
