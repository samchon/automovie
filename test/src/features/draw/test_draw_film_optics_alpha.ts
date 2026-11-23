import { AutoMovieFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * The film response stage carries alpha through its final pass only for a
 * picture drawn over a transparent clear, and an opaque picture keeps the final
 * pass it had before alpha was carried.
 *
 * Scenarios:
 *
 * 1. An opaque draw with optics leaves the final pass's alpha path off.
 * 2. A `transparent` draw turns it on, and so does a `coverage` draw, the graphics
 *    plate's.
 * 3. An opaque draw after them turns it off again, so no frame inherits an earlier
 *    frame's alpha mode.
 * 4. Every draw renders the scene into the linear target and the response into the
 *    canvas, the same two renders whatever the mode.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the stage with optics over the recording renderer and reads the final program's `uAlpha`, the uniform its shader branches on; a stage that ignored `alpha`, kept the last mode or drew a different pass list for a transparent picture fails.
 * @evidence contracts/development/testing.md#independent-expectations The contract of `AutoMovieFilmAlpha`: absent is opaque, either mode carries alpha; the two renders are the stage's documented steps 1 and 3 for optics without glare or overlays.
 * @evidence contracts/development/testing.md#distinguishing-cases Opaque, both alpha modes and the return to opaque; the shader's bytes, the glare's and the medium's alpha are observed by the SwiftShader capture, and absent optics by `test_draw_film_optics_absent`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_optics_alpha`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_optics_alpha(): void {
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()),
  );
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const draw: (alpha?: "transparent" | "coverage") => unknown = (
    alpha?: "transparent" | "coverage",
  ): unknown => {
    double.renders.length = 0;
    stage.draw({
      renderer: double.renderer,
      scene,
      camera,
      optics: { ev100: 0, toneMapping: "none" },
      seconds: 0,
      width: 32,
      height: 18,
      ...(alpha === undefined ? {} : { alpha }),
    });
    return stage.final.uniforms.uAlpha!.value;
  };

  // 1-3. The alpha path follows each draw's mode.
  const modes: unknown[] = [
    draw(),
    draw("transparent"),
    draw("coverage"),
    draw(),
  ];
  TestValidator.equals(
    "the alpha path is on only for a transparent or coverage draw",
    modes,
    [0, 1, 1, 0],
  );

  // 4. The same renders in every mode.
  draw("transparent");
  TestValidator.equals(
    "a transparent draw renders the linear light, then the response into the canvas",
    double.renders.map(
      (render: createFilmResponseRendererDouble.IRender): unknown[] => [
        render.object === scene,
        render.target === null,
      ],
    ),
    [
      [true, false],
      [false, true],
    ],
  );
  stage.dispose();
}
