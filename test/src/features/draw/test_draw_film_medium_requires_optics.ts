import {
  AutoMovieFilmResponseStage,
  applySceneMedium,
  readAutoMovieSceneMedium,
  renderAutoMovieScenePass,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { throwsError } from "../internal/throwsError";
import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * A medium is drawn only in the film's linear beauty target, so every path
 * without one refuses a scene that carries a medium, and attaching it is
 * reversible.
 *
 * Scenarios:
 *
 * 1. `applySceneMedium` attaches a copy of the medium that
 *    `readAutoMovieSceneMedium` returns; `null` removes it, and reading then
 *    gives null.
 * 2. The film response stage refuses to draw a scene with a medium and no optics,
 *    naming `optics` and the second, and draws nothing; the same scene without
 *    a medium draws once.
 * 3. `renderAutoMovieScenePass` refuses the beauty pass of a scene with a medium
 *    before touching the renderer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported attach and read functions, the stage over a recording renderer, and the scene pass; a missing refusal draws the scene without its haze, and a refusal after drawing would leave a render in the record.
 * @evidence contracts/development/testing.md#independent-expectations The refusals are the issue's: a draw scene with a medium and no optics throws naming `optics`, and the compiled-scene pass refuses a medium.
 * @evidence contracts/development/testing.md#distinguishing-cases With and without a medium, attach and detach. The marched picture, its shadows and its frame independence are judged by GPU captures.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test; the renderer is a recording double for the stage, and the scene pass refuses before any renderer member is read, so a bare prototype object stands in for it.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with their scenes and expected refusals.
 */
export function test_draw_film_medium_requires_optics(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  applySceneMedium(scene, { scattering: 0.05, absorption: 0, anisotropy: 0 });
  TestValidator.equals(
    "the attached medium reads back",
    readAutoMovieSceneMedium(scene),
    { scattering: 0.05, absorption: 0, anisotropy: 0 },
  );

  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const draw: () => void = (): void =>
    stage.draw({
      renderer: double.renderer,
      scene,
      camera,
      optics: undefined,
      seconds: 3,
      width: 32,
      height: 18,
    });
  TestValidator.predicate(
    "a medium without optics is refused before drawing",
    throwsError(draw, ["optics", "3 s"]) && double.renders.length === 0,
  );

  // The scene pass reads nothing from its renderer before the refusal.
  const renderer: THREE.WebGLRenderer = Object.create(
    THREE.WebGLRenderer.prototype,
  );
  TestValidator.predicate(
    "the compiled-scene pass refuses a medium",
    throwsError(
      (): void =>
        renderAutoMovieScenePass(renderer, scene, camera, null, "beauty"),
      "medium",
    ),
  );

  applySceneMedium(scene, null);
  draw();
  TestValidator.predicate(
    "without a medium the plain draw renders once",
    readAutoMovieSceneMedium(scene) === null && double.renders.length === 1,
  );
  stage.dispose();
}
