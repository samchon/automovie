import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { AutoMovieFilmResponseStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * On the draw path a film's optics own the response: the renderer's own curve
 * and exposure are held neutral while the scene draws, whatever the host set,
 * and display overlays are drawn after the response instead of through it.
 *
 * Scenarios:
 *
 * 1. With the host renderer set to the ACES filmic curve and exposure 4, the scene
 *    still draws with no curve and exposure 1, and the final pass carries the
 *    same 1 / 48000 scale as with a neutral host.
 * 2. After the draw the host's curve, exposure, target, clear policy and
 *    shadow-map updates are back as they were.
 * 3. A mark drawn with `toneMapped: false` is left out of the linear draw, then
 *    drawn alone over the response: the camera sees only it, the background is
 *    off, the canvas is not cleared and shadow maps are not redrawn; afterwards
 *    the mark's and camera's layers and the background are restored.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the stage over a recording renderer that logs the state of every render call; a stage that inherited the host's curve or exposure, leaked state, drew overlays through the exposure or redrew the background over the picture fails.
 * @evidence contracts/development/testing.md#independent-expectations The neutral state and the restoration are the issue's ownership rule; the scale is the ISO 12232 mapping of `ev100: log2(40000)`; the overlay rule follows from overlays stating display colours.
 * @evidence contracts/development/testing.md#distinguishing-cases A host with a non-neutral curve against a neutral one, and a scene with and without an overlay. The exposure arithmetic is owned by `test_draw_film_optics_exposure`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_optics_owner`; the renderer is an in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_film_optics_owner(): void {
  const optics: IAutoMovieFilmOptics = {
    ev100: Math.log2(40000),
    toneMapping: "none",
  };
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0.2, 0.3, 0.4);
  const card: THREE.Mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.MeshStandardMaterial(),
  );
  const mark: THREE.LineSegments = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ toneMapped: false }),
  );
  scene.add(card, mark);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  const scale: () => number[] = (): number[] =>
    (stage.final.uniforms.uResponse!.value as THREE.Matrix3).toArray();

  // 1. A neutral host and an ACES host give the same draw.
  const neutral: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
      watched: [card, mark],
    });
  stage.draw({
    renderer: neutral.renderer,
    scene,
    camera,
    optics,
    seconds: 0,
    width: 32,
    height: 18,
  });
  const neutralScale: number[] = scale();
  const graded: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.ACESFilmicToneMapping,
      exposure: 4,
      watched: [card, mark],
    });
  stage.draw({
    renderer: graded.renderer,
    scene,
    camera,
    optics,
    seconds: 0,
    width: 32,
    height: 18,
  });
  const linear: createFilmResponseRendererDouble.IRender = graded.renders[0]!;
  TestValidator.predicate(
    "the scene draws with no curve at exposure 1 whatever the host set",
    linear.toneMapping === THREE.NoToneMapping &&
      linear.exposure === 1 &&
      scale().every((value: number, index: number): boolean =>
        nclose(value, neutralScale[index]!, 0),
      ) &&
      nclose(neutralScale[0]!, 1 / 48000, 1e-12),
  );

  // 2. The host's state is restored.
  TestValidator.equals(
    "host state after the draw",
    [
      graded.renderer.toneMapping,
      graded.renderer.toneMappingExposure,
      graded.renderer.getRenderTarget(),
      graded.renderer.autoClear,
      graded.renderer.shadowMap.autoUpdate,
    ],
    [THREE.ACESFilmicToneMapping, 4, null, true, true],
  );

  // 3. The overlay is drawn after the response, alone.
  const overlay: createFilmResponseRendererDouble.IRender =
    graded.renders.at(-1)!;
  TestValidator.equals(
    "the linear draw sees the card and not the mark",
    linear.seen,
    [true, false],
  );
  TestValidator.predicate(
    "the overlay draw sees only the mark, over the canvas, without background, clear or shadow update",
    graded.renders.length === 3 &&
      overlay.object === scene &&
      overlay.target === null &&
      overlay.seen[0] === false &&
      overlay.seen[1] === true &&
      overlay.background === null &&
      overlay.autoClear === false &&
      overlay.shadowUpdate === false,
  );
  TestValidator.predicate(
    "layers and background restored",
    card.layers.mask === 1 &&
      mark.layers.mask === 1 &&
      camera.layers.mask === 1 &&
      scene.background instanceof THREE.Color,
  );
  stage.dispose();
}
