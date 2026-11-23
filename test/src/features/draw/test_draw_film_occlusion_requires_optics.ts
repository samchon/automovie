import { admitAutoMovieFilmShading } from "@automovie/engine";
import { AutoMovieFilmIndirectStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { throwsError } from "../internal/throwsError";
import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * Occlusion lives beside the optics' linear target, so a film asking for it
 * without optics is refused before anything is drawn, naming `optics`, and a
 * malformed radius is refused naming the second and the field.
 *
 * Scenarios:
 *
 * 1. `occlusion: { radius: 0.5 }` without optics throws an error naming `optics`
 *    and the second, from both the engine admission and the stage, and the
 *    stage draws nothing and calls no beauty pass.
 * 2. A radius of 0, a negative radius and a non-finite radius are refused naming
 *    `occlusion.radius`.
 * 3. A radius of 0.5 with optics, and an empty shading without optics, are
 *    admitted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the admission and the stage; a missing optics check, a refusal after drawing or a refusal that names the wrong field fails.
 * @evidence contracts/development/testing.md#independent-expectations The refusals are the issue's: occlusion requires optics, and the radius is finite and above zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive radius against zero, negative and infinite; with and without optics; empty shading. Absent shading is owned by `test_draw_film_occlusion_direct`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_occlusion_requires_optics`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_occlusion_requires_optics(): void {
  const message: (run: () => void) => string = (run: () => void): string => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof Error ? error.message : String(error);
    }
    return "";
  };

  // 1. No optics.
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const stage: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
  let called: boolean = false;
  const refused: string = message(() =>
    stage.draw(
      {
        renderer: double.renderer,
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        shading: { occlusion: { radius: 0.5 } },
        optics: false,
        seconds: 2.5,
        width: 32,
        height: 18,
        sample: 0,
      },
      (): void => {
        called = true;
      },
    ),
  );
  TestValidator.predicate(
    "occlusion without optics is refused naming optics, before drawing",
    refused.includes("optics") &&
      refused.includes("2.5") &&
      message(() =>
        admitAutoMovieFilmShading({ occlusion: { radius: 0.5 } }, 2.5, false),
      ).includes("optics") &&
      !called &&
      double.renders.length === 0,
  );

  // 2. Radii.
  for (const radius of [0, -1, Infinity])
    TestValidator.predicate(
      `a radius of ${radius} is refused`,
      message(() =>
        admitAutoMovieFilmShading({ occlusion: { radius } }, 1, true),
      ).includes("occlusion.radius"),
    );

  // 3. Admitted.
  TestValidator.predicate(
    "a positive radius with optics and an empty shading are admitted",
    !throwsError(() =>
      admitAutoMovieFilmShading({ occlusion: { radius: 0.5 } }, 1, true),
    ) && !throwsError(() => admitAutoMovieFilmShading({}, 1, false)),
  );
  stage.dispose();
}
