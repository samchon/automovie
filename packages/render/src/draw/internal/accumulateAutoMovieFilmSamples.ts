import { AutoMovieEngineFilmResponse } from "@automovie/engine";
import type { IAutoMoviePlanFilmSamples } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../../scene/AutoMovieThreeKind.js";
import type { IAutoMovieAccumulateFilmSamplesProps } from "../IAutoMovieAccumulateFilmSamplesProps.js";

/*
 * Place and draw every sub-frame sample of one frame into the film response
 * stage's running average, then place the frame's own second again.
 *
 * The samples are `planAutoMovieFilmSamples` of the frame's optics, which the
 * caller has read at `seconds` with `samples` set. For each sample in order the
 * scene is placed at the sample's second by `seek`, the drawing camera is
 * resolved at that second, and, when the sample has an eye offset, the camera
 * is replaced by `scratch` moved by the offset along the camera's right and up
 * axes with its frustum sheared so the plane at the lens's `focusDistance`
 * projects unchanged (Haeberli and Akeley 1990, "The accumulation buffer",
 * SIGGRAPH). The stage then renders and adds that sample. Samples come in
 * ascending time, which the scene's springs require. After the last sample the
 * scene is placed at `seconds` again, so marks, diagnostics and labels read
 * afterwards describe the frame's own second.
 *
 * The shear adds `−e × P₀₀ / f` and `−e × P₁₁ / f` to the projection's third
 * column for an eye offset `e` and focus distance `f`: a point at depth `f`,
 * seen from an eye moved by `e`, lands where the unmoved eye saw it. An
 * orthographic camera has no aperture and is drawn unmoved.
 * Parameter props: The stage, renderer, scene, optics, frame and raster, and the
 * host's placement and camera callbacks.
 * Returns: The samples drawn, in drawing order.
 */
export async function accumulateAutoMovieFilmSamples(props: IAutoMovieAccumulateFilmSamplesProps): Promise<IAutoMoviePlanFilmSamples.ISample[]> {
  const samples: IAutoMoviePlanFilmSamples.ISample[] = AutoMovieEngineFilmResponse.planAutoMovieFilmSamples(
    {
      seconds: props.seconds,
      fps: props.fps,
      optics: props.optics,
      fovY: props.fovY,
    },
  );
  const focus: number | null = props.optics.lens?.focusDistance ?? null;
  for (const [index, sample] of samples.entries()) {
    await props.seek(sample.seconds);
    const base: THREE.Camera = props.camera(sample.seconds);
    const camera: THREE.Camera =
      sample.eye !== null &&
      focus !== null &&
      AutoMovieThreeKind.isPerspectiveCamera(base)
        ? offsetLens(props.scratch, base, sample.eye, focus)
        : base;
    const draw: () => void = (): void =>
      props.stage.accumulate({
        renderer: props.renderer,
        scene: props.scene,
        camera,
        optics: props.optics,
        seconds: props.seconds,
        width: props.width,
        height: props.height,
        index,
        count: samples.length,
        ...(props.alpha === undefined ? {} : { alpha: props.alpha }),
      });
    if (props.around === undefined) draw();
    else props.around({ camera, seconds: sample.seconds, index }, draw);
  }
  await props.seek(props.seconds);
  return samples;
}

/*
 * Copy `base` into `scratch`, move its eye by `eye` metres along `base`'s world
 * right and up axes, and shear its projection so the plane at `focusDistance`
 * projects as it did from `base`.
 */
function offsetLens(
  scratch: THREE.PerspectiveCamera,
  base: THREE.PerspectiveCamera,
  eye: { x: number; y: number },
  focusDistance: number,
): THREE.PerspectiveCamera {
  base.updateMatrixWorld();
  const position: THREE.Vector3 = new THREE.Vector3();
  const rotation: THREE.Quaternion = new THREE.Quaternion();
  const scale: THREE.Vector3 = new THREE.Vector3();
  base.matrixWorld.decompose(position, rotation, scale);
  const right: THREE.Vector3 = new THREE.Vector3(1, 0, 0).applyQuaternion(
    rotation,
  );
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0).applyQuaternion(
    rotation,
  );

  scratch.copy(base, false);
  scratch.position
    .copy(position)
    .addScaledVector(right, eye.x)
    .addScaledVector(up, eye.y);
  scratch.quaternion.copy(rotation);
  scratch.scale.set(1, 1, 1);
  scratch.updateMatrixWorld(true);

  // The base projection, its window shifted against the eye in proportion to
  // near / focusDistance.
  const elements: number[] = scratch.projectionMatrix.copy(
    base.projectionMatrix,
  ).elements;
  elements[8] = elements[8]! - (eye.x * elements[0]!) / focusDistance;
  elements[9] = elements[9]! - (eye.y * elements[5]!) / focusDistance;
  scratch.projectionMatrixInverse.copy(scratch.projectionMatrix).invert();
  return scratch;
}
