import { AutoMovieRenderFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "../../internal/createFilmResponseRendererDouble";

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
 * @evidence contracts/development/common.md#meaningful-documentation Names transparent and coverage alpha, reset on opaque output and fixed draw count.
 * @evidence contracts/development/testing.md#behavioral-verification Runs four frame modes through the native response stage and records the actual pass uniforms and renderer target calls.
 * @evidence contracts/development/testing.md#independent-expectations Opaque starts and ends with the alpha path off. Transparent and coverage each turn it on for their own frame. Every mode has one linear scene draw and one canvas response, so an extra draw or stale flag fails.
 */
export function test_render_scene_film_response_stage_film_optics_alpha(): void {
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
  const stage: AutoMovieRenderFilmResponseStage = new AutoMovieRenderFilmResponseStage();
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
