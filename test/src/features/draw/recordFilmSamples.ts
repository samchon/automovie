import type { IAutoMovieFilmOptics } from "@automovie/interface";
import { accumulateAutoMovieFilmSamples } from "@automovie/render";
import * as THREE from "three";

import { createFilmResponseRendererDouble } from "./createFilmResponseRendererDouble";

/**
 * Run one frame's sub-frame samples through `accumulateAutoMovieFilmSamples`
 * with a stage that records, for each sample, where `probe` reads the scene
 * through the sample's camera, in pixels from the top-left of a `width` by
 * `height` raster.
 *
 * The camera stands at the origin looking down −Z with the given vertical field
 * of view and the raster's aspect. `place` moves the scene for a second before
 * each sample is drawn; `probe` returns the world points to project.
 *
 * @param props The optics, frame, raster, field of view, placement and probe.
 * @returns One list of projected pixel positions per sample, in sample order.
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed camera, the pixel convention, and what is recorded per sample.
 * @evidence contracts/development/implementation.md#principled-implementation Projects through the camera object the loop hands the stage, after updating its world matrix, with three's own `project`, so the record is what the GPU's vertex stage would compute.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One recorder shared by the shutter and lens tests so each states only its geometry and expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes no expected value; the tests derive theirs independently.
 * @evidence contracts/development/implementation.md#efficient-algorithms One projection per probe point per sample.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is one fresh frame.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the returned positions.
 */
export async function recordFilmSamples(props: {
  optics: IAutoMovieFilmOptics;
  seconds: number;
  fps: number;
  fovY: number;
  width: number;
  height: number;
  place: (seconds: number) => void;
  probe: () => THREE.Vector3[];
}): Promise<{ x: number; y: number }[][]> {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    props.fovY,
    props.width / props.height,
    0.1,
    100,
  );
  camera.updateMatrixWorld(true);
  const recorded: { x: number; y: number }[][] = [];
  await accumulateAutoMovieFilmSamples({
    stage: {
      accumulate: (sample: { camera: THREE.Camera }): void => {
        sample.camera.updateMatrixWorld(true);
        recorded.push(
          props
            .probe()
            .map((point: THREE.Vector3): { x: number; y: number } => {
              const ndc: THREE.Vector3 = point.clone().project(sample.camera);
              return {
                x: ((ndc.x + 1) / 2) * props.width,
                y: ((1 - ndc.y) / 2) * props.height,
              };
            }),
        );
      },
    },
    renderer: createFilmResponseRendererDouble({
      toneMapping: THREE.NoToneMapping,
      exposure: 1,
    }).renderer,
    scene: new THREE.Scene(),
    optics: props.optics,
    seconds: props.seconds,
    fps: props.fps,
    fovY: props.fovY,
    width: props.width,
    height: props.height,
    seek: async (at: number): Promise<void> => props.place(at),
    camera: (): THREE.Camera => camera,
    scratch: new THREE.PerspectiveCamera(),
  });
  return recorded;
}
