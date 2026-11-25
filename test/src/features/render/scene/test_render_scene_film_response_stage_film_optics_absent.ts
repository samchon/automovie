import { AutoMovieFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "../../internal/createFilmResponseRendererDouble";

/**
 * A subject without optics draws exactly as before the film response stage
 * existed: one render of the scene into the host's current target, under the
 * host's own curve and exposure.
 *
 * Scenarios:
 *
 * 1. With no optics and a host set to the ACES filmic curve at exposure 2, the
 *    stage makes one render call, of the scene, into the canvas, under that
 *    curve and exposure, with the scene's overlays visible in the same draw.
 * 2. The host's state is untouched afterwards and no target was ever set.
 */
export function test_render_scene_film_response_stage_film_optics_absent(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const mark: THREE.LineSegments = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ toneMapped: false }),
  );
  scene.add(mark);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.ACESFilmicToneMapping,
      exposure: 2,
      watched: [mark],
    });
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  stage.draw({
    renderer: double.renderer,
    scene,
    camera,
    optics: undefined,
    seconds: 0,
    width: 32,
    height: 18,
  });

  // 1. One plain render.
  TestValidator.equals(
    "one render of the scene into the canvas under the host's response",
    double.renders.map(
      (render: createFilmResponseRendererDouble.IRender): unknown[] => [
        render.object === scene,
        render.target,
        render.toneMapping,
        render.exposure,
        render.seen,
      ],
    ),
    [[true, null, THREE.ACESFilmicToneMapping, 2, [true]]],
  );

  // 2. Nothing changed.
  TestValidator.equals(
    "host state untouched",
    [
      double.renderer.toneMapping,
      double.renderer.toneMappingExposure,
      double.renderer.getRenderTarget(),
    ],
    [THREE.ACESFilmicToneMapping, 2, null],
  );
  stage.dispose();
}
