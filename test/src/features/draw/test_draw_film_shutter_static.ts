import type { IAutoMovieFilmOptics } from "@automovie/interface";
import {
  AutoMovieFilmResponseStage,
  accumulateAutoMovieFilmSamples,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * A static scene drawn through a shutter is the scene drawn sharp: every
 * sub-frame sample draws the same placement through the same camera, and the
 * samples are averaged at equal weight, so the frame is that one picture.
 *
 * Scenarios, at 24 fps and t = 1 s, through the film response stage:
 *
 * 1. With a 180° shutter over four samples, each of the four renders of a static
 *    box draws it at the same world placement through the same view and
 *    projection as the single sharp render of the same second without a
 *    shutter.
 * 2. The running sum adds each sample at unit weight, starting a new sum at sample
 *    0, and the last writes the sum times 1/4 over the linear target, so four
 *    equal samples average to their own value.
 * 3. A box the placement moves across the shutter interval is drawn at four
 *    different placements, so scenario 1 tells a static scene from a moving
 *    one.
 *
 * Four equal binary32 samples sum and scale by an exact power of two, so the
 * average differs from the sample by at most the rounding of the partial sums,
 * a few units in the last place, below the 1/255 an 8-bit frame quantizes to;
 * the frame hash itself is read on a GPU by a capture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the shutter, the scene and what each scenario pins, and how close the average is to the sample.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public accumulation loop and the film response stage over a recording renderer that notes each scene render's camera and box placement and each sum pass's uniforms; a sample drawn elsewhere than the frame, a weight other than 1/N or a sum carried from an earlier sample fails.
 * @evidence contracts/development/testing.md#independent-expectations Issue #4078's acceptance that a static scene renders the same frame with and without a shutter, which holds exactly when every sample is the same picture and the weights are equal and sum to one.
 * @evidence contracts/development/testing.md#distinguishing-cases A static box, the same box moving, and the sharp draw; the samples' seconds belong to test_draw_film_shutter_times and the blur width to test_draw_film_shutter_blur.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over a recording renderer; no GPU starts.
 */
export async function test_draw_film_shutter_static(): Promise<void> {
  const shutter: IAutoMovieFilmOptics = {
    ev100: 10,
    toneMapping: "none",
    samples: 4,
    shutter: { angle: 180 },
  };

  // 1. Static: four samples, each the sharp picture.
  const sharp: IRecorded = await record({ ...shutter }, false, false);
  const blurred: IRecorded = await record(shutter, true, false);
  TestValidator.predicate(
    "each static sample draws the sharp picture",
    sharp.placements.length === 1 &&
      blurred.placements.length === 4 &&
      blurred.placements.every(
        (placement: string): boolean => placement === sharp.placements[0],
      ),
  );

  // 2. Equal weights.
  TestValidator.equals(
    "four unit-weight adds, then the sum times 1/4",
    blurred.sums,
    [
      [1, 1],
      [0, 1],
      [0, 1],
      [0, 1],
      [1, 0.25],
    ],
  );

  // 3. A moving box is drawn at four placements.
  const moving: IRecorded = await record(shutter, true, true);
  TestValidator.equals(
    "a moving box is drawn at four placements",
    new Set(moving.placements).size,
    4,
  );
}

/** What one frame drew. */
interface IRecorded {
  /** Each scene render's view, projection and box placement, serialized. */
  placements: string[];

  /** Each sum pass's `uFirst` and `uScale`. */
  sums: number[][];
}

/**
 * Draw one frame of a box five metres in front of a fixed camera at t = 1 s:
 * accumulated through the shutter when `accumulate` is set, else one sharp
 * draw; `moving` slides the box along x at 2 m/s with the placed second.
 */
async function record(
  optics: IAutoMovieFilmOptics,
  accumulate: boolean,
  moving: boolean,
): Promise<IRecorded> {
  const scene: THREE.Scene = new THREE.Scene();
  const box: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial(),
  );
  box.position.set(0, 0, -5);
  scene.add(box);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    45,
    16 / 9,
    0.1,
    100,
  );
  camera.updateMatrixWorld(true);
  const place: (seconds: number) => void = (seconds: number): void => {
    box.position.x = moving ? 2 * seconds : 0;
    scene.updateMatrixWorld(true);
  };
  const double: createFilmResponseRendererDouble.IDouble =
    createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    });
  const placements: string[] = [];
  const render: typeof double.renderer.render = double.renderer.render;
  double.renderer.render = (
    object: THREE.Object3D,
    eye: THREE.Camera,
  ): void => {
    if (object === scene)
      placements.push(
        JSON.stringify([
          eye.matrixWorldInverse.elements,
          eye.projectionMatrix.elements,
          box.matrixWorld.elements,
        ]),
      );
    render(object, eye);
  };
  const stage: AutoMovieFilmResponseStage = new AutoMovieFilmResponseStage();
  place(1);
  if (accumulate)
    await accumulateAutoMovieFilmSamples({
      stage,
      renderer: double.renderer,
      scene,
      optics,
      seconds: 1,
      fps: 24,
      fovY: 45,
      width: 64,
      height: 36,
      seek: async (seconds: number): Promise<void> => place(seconds),
      camera: (): THREE.Camera => camera,
      scratch: new THREE.PerspectiveCamera(),
    });
  else
    stage.draw({
      renderer: double.renderer,
      scene,
      camera,
      optics: { ev100: optics.ev100, toneMapping: optics.toneMapping },
      seconds: 1,
      width: 64,
      height: 36,
    });
  stage.dispose();
  return {
    placements,
    sums: double.renders
      .filter(
        (entry: createFilmResponseRendererDouble.IRender): boolean =>
          entry.program !== null && "uFirst" in entry.program,
      )
      .map((entry: createFilmResponseRendererDouble.IRender): number[] => [
        entry.program!.uFirst as number,
        entry.program!.uScale as number,
      ]),
  };
}
